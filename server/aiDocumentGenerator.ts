import OpenAI from "openai";
import { db } from "./db";
import { employees, companies, departments } from "@shared/schema";
import { eq } from "drizzle-orm";

export interface DocumentGenerationRequest {
  type: 'policy' | 'contract' | 'letter' | 'report' | 'handbook' | 'job_description';
  employeeId?: string;
  companyId?: string;
  templateData?: Record<string, any>;
  customPrompt?: string;
}

export interface GeneratedDocument {
  title: string;
  content: string;
  format: 'markdown' | 'html' | 'plain';
  metadata: {
    generatedAt: Date;
    documentType: string;
    employeeId?: string;
    companyId?: string;
  };
}

export class AIDocumentGenerator {
  private openai: OpenAI;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      console.warn("⚠️ OPENAI_API_KEY not set - AI document generation will be disabled");
      this.openai = null as any; // Will throw proper errors in methods
    } else {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    }
  }

  async generateDocument(request: DocumentGenerationRequest): Promise<GeneratedDocument> {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key is required for AI document generation. Please provide your OpenAI API key to use this feature.");
    }

    try {
      const { type, employeeId, companyId, templateData, customPrompt } = request;

      // Gather context data
      const context = await this.gatherContextData(employeeId, companyId);
      
      // Generate appropriate prompt based on document type
      const prompt = customPrompt || await this.createPrompt(type, context, templateData);

      // Generate document using GPT-4o
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are an expert HR document generator. Create professional, legally compliant, and well-structured HR documents. Always follow employment law best practices and include necessary disclaimers."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000
      });

      const content = response.choices[0].message.content || "";
      
      return {
        title: this.generateDocumentTitle(type, context),
        content,
        format: 'markdown',
        metadata: {
          generatedAt: new Date(),
          documentType: type,
          employeeId,
          companyId
        }
      };

    } catch (error) {
      console.error('❌ Error generating document:', error);
      throw error;
    }
  }

  private async gatherContextData(employeeId?: string, companyId?: string) {
    const context: any = {};

    if (employeeId) {
      const [employee] = await db.select()
        .from(employees)
        .innerJoin(departments, eq(employees.departmentId, departments.id))
        .where(eq(employees.id, employeeId));

      if (employee) {
        context.employee = {
          ...employee.employees,
          department: employee.departments
        };
      }
    }

    if (companyId) {
      const [company] = await db.select()
        .from(companies)
        .where(eq(companies.id, companyId));

      if (company) {
        context.company = company;
      }
    }

    // Add current date and other metadata
    context.currentDate = new Date().toLocaleDateString();
    context.currentYear = new Date().getFullYear();

    return context;
  }

  private async createPrompt(type: string, context: any, templateData?: Record<string, any>): Promise<string> {
    const baseContext = `
    Company Information: ${context.company ? JSON.stringify(context.company, null, 2) : 'Not provided'}
    Employee Information: ${context.employee ? JSON.stringify(context.employee, null, 2) : 'Not provided'}
    Current Date: ${context.currentDate}
    Additional Data: ${templateData ? JSON.stringify(templateData, null, 2) : 'None'}
    `;

    switch (type) {
      case 'policy':
        return `${baseContext}
        
        Create a comprehensive HR policy document. Include the following sections:
        1. Policy Statement and Purpose
        2. Scope and Applicability
        3. Definitions
        4. Policy Details and Procedures
        5. Compliance and Enforcement
        6. Review and Updates
        
        Make it professional, legally compliant, and specific to the company context provided.
        Format: Use clear headings, bullet points, and professional language.`;

      case 'contract':
        return `${baseContext}
        
        Generate an employment contract for the specified employee. Include:
        1. Company and Employee Details
        2. Job Title and Description
        3. Compensation and Benefits
        4. Working Hours and Schedule
        5. Confidentiality and Non-Disclosure
        6. Termination Clauses
        7. Legal Compliance Statements
        
        Ensure all legal requirements are met and use professional contract language.`;

      case 'letter':
        return `${baseContext}
        
        Create a professional business letter. Determine the appropriate type based on context:
        - Offer letter for new employees
        - Promotion letter
        - Warning letter
        - Appreciation letter
        - Termination letter
        
        Use formal business letter format with proper salutations and closings.`;

      case 'report':
        return `${baseContext}
        
        Generate a comprehensive HR report. Include:
        1. Executive Summary
        2. Data Analysis and Insights
        3. Key Metrics and KPIs
        4. Recommendations
        5. Action Items
        6. Appendices with supporting data
        
        Use data-driven language and include visual descriptions for charts/graphs.`;

      case 'handbook':
        return `${baseContext}
        
        Create an employee handbook section. Cover:
        1. Company Overview and Culture
        2. Employment Policies
        3. Code of Conduct
        4. Benefits and Compensation
        5. Leave Policies
        6. Performance Management
        7. Health and Safety
        8. IT and Security Policies
        
        Make it engaging and easy to understand for employees.`;

      case 'job_description':
        return `${baseContext}
        
        Create a detailed job description including:
        1. Job Title and Department
        2. Job Summary
        3. Key Responsibilities and Duties
        4. Required Qualifications and Skills
        5. Preferred Qualifications
        6. Working Conditions
        7. Salary Range and Benefits
        8. Application Process
        
        Use clear, action-oriented language and include both technical and soft skills.`;

      default:
        return `${baseContext}
        
        Generate a professional HR document of type "${type}". Use best practices for HR documentation,
        ensure legal compliance, and maintain a professional tone throughout.`;
    }
  }

  private generateDocumentTitle(type: string, context: any): string {
    const company = context.company?.name || 'Company';
    const employee = context.employee?.name || 'Employee';
    const currentDate = new Date().toLocaleDateString();

    switch (type) {
      case 'policy':
        return `HR Policy Document - ${company} - ${currentDate}`;
      case 'contract':
        return `Employment Contract - ${employee} - ${company}`;
      case 'letter':
        return `Business Letter - ${employee} - ${currentDate}`;
      case 'report':
        return `HR Report - ${company} - ${currentDate}`;
      case 'handbook':
        return `Employee Handbook - ${company} - ${currentDate}`;
      case 'job_description':
        return `Job Description - ${context.employee?.designation || 'Position'} - ${company}`;
      default:
        return `HR Document - ${company} - ${currentDate}`;
    }
  }

  async generatePolicyFromTemplate(policyType: string, companyId: string, customRequirements?: string[]): Promise<GeneratedDocument> {
    const policyTemplates = {
      'remote_work': {
        sections: ['Eligibility', 'Equipment and Technology', 'Communication Protocols', 'Performance Management', 'Data Security'],
        focus: 'remote work arrangements and guidelines'
      },
      'dress_code': {
        sections: ['Professional Attire Standards', 'Business Casual Guidelines', 'Special Occasions', 'Safety Requirements'],
        focus: 'workplace appearance and dress standards'
      },
      'social_media': {
        sections: ['Personal vs Professional Use', 'Confidentiality Requirements', 'Brand Representation', 'Compliance Guidelines'],
        focus: 'social media usage and company representation'
      },
      'anti_harassment': {
        sections: ['Definition and Scope', 'Reporting Procedures', 'Investigation Process', 'Disciplinary Actions', 'Support Resources'],
        focus: 'prevention and handling of workplace harassment'
      },
      'attendance': {
        sections: ['Working Hours', 'Punctuality Requirements', 'Leave Procedures', 'Absence Reporting', 'Disciplinary Measures'],
        focus: 'employee attendance and time management'
      }
    };

    const template = policyTemplates[policyType as keyof typeof policyTemplates];
    
    const templateData = {
      policyType,
      sections: template?.sections || [],
      focus: template?.focus || 'general workplace guidelines',
      customRequirements: customRequirements || []
    };

    return this.generateDocument({
      type: 'policy',
      companyId,
      templateData,
      customPrompt: `Create a comprehensive ${policyType.replace('_', ' ')} policy focusing on ${template?.focus}. 
      Include these sections: ${template?.sections.join(', ')}. 
      ${customRequirements?.length ? `Also address these specific requirements: ${customRequirements.join(', ')}` : ''}
      Make it legally compliant and actionable.`
    });
  }

  async generateOfferLetter(employeeId: string, position: string, salary: number, startDate: string, benefits?: string[]): Promise<GeneratedDocument> {
    const templateData = {
      position,
      salary,
      startDate,
      benefits: benefits || ['Health Insurance', 'Paid Time Off', 'Retirement Plan']
    };

    return this.generateDocument({
      type: 'letter',
      employeeId,
      templateData,
      customPrompt: `Generate a formal job offer letter for the position of ${position}. 
      Include salary of $${salary}, start date of ${startDate}, and these benefits: ${benefits?.join(', ') || 'standard benefits'}. 
      Use professional tone and include all necessary legal disclaimers.`
    });
  }

  async generatePerformanceReview(employeeId: string, reviewPeriod: string, achievements: string[], improvements: string[]): Promise<GeneratedDocument> {
    const templateData = {
      reviewPeriod,
      achievements,
      improvements
    };

    return this.generateDocument({
      type: 'report',
      employeeId,
      templateData,
      customPrompt: `Create a comprehensive performance review for the period ${reviewPeriod}. 
      Highlight these achievements: ${achievements.join(', ')}. 
      Address these areas for improvement: ${improvements.join(', ')}. 
      Include goals for the next review period and development recommendations.`
    });
  }

  async batchGenerateDocuments(requests: DocumentGenerationRequest[]): Promise<GeneratedDocument[]> {
    const results = [];
    
    for (const request of requests) {
      try {
        const document = await this.generateDocument(request);
        results.push(document);
      } catch (error) {
        console.error(`❌ Error generating document of type ${request.type}:`, error);
        results.push({
          title: `Error - ${request.type}`,
          content: `Failed to generate document: ${error instanceof Error ? error.message : 'Unknown error'}`,
          format: 'plain' as const,
          metadata: {
            generatedAt: new Date(),
            documentType: request.type,
            employeeId: request.employeeId,
            companyId: request.companyId
          }
        });
      }
    }

    return results;
  }
}

export const aiDocumentGenerator = new AIDocumentGenerator();