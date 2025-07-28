export interface ParsedStep {
    step: string;
    action: string;
    file: string;
}

export interface ParsedPatch {
    file: string;
    changes: string;
}

export interface ParsedSummary {
    completed: string[];
    next: string;
}

export interface ParsedInsight {
    finding: string;
    data: string;
    recommendation: string;
}

export interface ParsedPlan {
    plan: string;
    steps: string[];
    files: string[];
    risks: string;
}

export interface ParsedResponse {
    plans?: ParsedPlan[];
    steps?: ParsedStep[];
    patches?: ParsedPatch[];
    summaries?: ParsedSummary[];
    insights?: ParsedInsight[];
    rawText: string;
    hasStructuredContent: boolean;
}

export class ResponseParser {
    /**
     * Parse a response that may contain structured content
     */
    static parseResponse(content: string): ParsedResponse {
        const result: ParsedResponse = {
            rawText: content,
            hasStructuredContent: false
        };

        // Parse plans
        const planMatches = content.match(/```plan\n([\s\S]*?)\n```/g);
        if (planMatches) {
            result.plans = planMatches.map(match => this.parsePlan(match));
            result.hasStructuredContent = true;
        }

        // Parse steps
        const stepMatches = content.match(/```step\n([\s\S]*?)\n```/g);
        if (stepMatches) {
            result.steps = stepMatches.map(match => this.parseStep(match));
            result.hasStructuredContent = true;
        }

        // Parse patches
        const patchMatches = content.match(/```patch\n([\s\S]*?)\n```/g);
        if (patchMatches) {
            result.patches = patchMatches.map(match => this.parsePatch(match));
            result.hasStructuredContent = true;
        }

        // Parse summaries
        const summaryMatches = content.match(/```summary\n([\s\S]*?)\n```/g);
        if (summaryMatches) {
            result.summaries = summaryMatches.map(match => this.parseSummary(match));
            result.hasStructuredContent = true;
        }

        // Parse insights
        const insightMatches = content.match(/```insights\n([\s\S]*?)\n```/g);
        if (insightMatches) {
            result.insights = insightMatches.map(match => this.parseInsight(match));
            result.hasStructuredContent = true;
        }

        return result;
    }

    /**
     * Parse a plan block
     */
    private static parsePlan(planBlock: string): ParsedPlan {
        const content = planBlock.replace(/```plan\n/, '').replace(/\n```/, '');
        const lines = content.split('\n');
        
        let plan = '';
        const steps: string[] = [];
        const files: string[] = [];
        let risks = '';

        for (const line of lines) {
            if (line.startsWith('PLAN:')) {
                plan = line.replace('PLAN:', '').trim();
            } else if (line.startsWith('STEPS:')) {
                const stepsContent = line.replace('STEPS:', '').trim();
                // Split by common delimiters and clean up
                steps.push(...stepsContent.split(/[,;]/).map(item => item.trim()).filter(item => item));
            } else if (line.startsWith('FILES:')) {
                const filesContent = line.replace('FILES:', '').trim();
                // Split by common delimiters and clean up
                files.push(...filesContent.split(/[,;]/).map(item => item.trim()).filter(item => item));
            } else if (line.startsWith('RISKS:')) {
                risks = line.replace('RISKS:', '').trim();
            }
        }

        return { plan, steps, files, risks };
    }

    /**
     * Parse a step block
     */
    private static parseStep(stepBlock: string): ParsedStep {
        const content = stepBlock.replace(/```step\n/, '').replace(/\n```/, '');
        const lines = content.split('\n');
        
        let step = '';
        let action = '';
        let file = '';

        for (const line of lines) {
            if (line.startsWith('STEP:')) {
                step = line.replace('STEP:', '').trim();
            } else if (line.startsWith('ACTION:')) {
                action = line.replace('ACTION:', '').trim();
            } else if (line.startsWith('FILE:')) {
                file = line.replace('FILE:', '').trim();
            }
        }

        return { step, action, file };
    }

    /**
     * Parse a patch block
     */
    private static parsePatch(patchBlock: string): ParsedPatch {
        const content = patchBlock.replace(/```patch\n/, '').replace(/\n```/, '');
        const lines = content.split('\n');
        
        let file = '';
        let changes = '';

        for (const line of lines) {
            if (line.startsWith('FILE:')) {
                file = line.replace('FILE:', '').trim();
            } else if (line.startsWith('CHANGES:')) {
                // Get all content after CHANGES:
                const changesIndex = content.indexOf('CHANGES:');
                if (changesIndex !== -1) {
                    changes = content.substring(changesIndex + 8).trim();
                }
                break;
            }
        }

        return { file, changes };
    }

    /**
     * Parse a summary block
     */
    private static parseSummary(summaryBlock: string): ParsedSummary {
        const content = summaryBlock.replace(/```summary\n/, '').replace(/\n```/, '');
        const lines = content.split('\n');
        
        const completed: string[] = [];
        let next = '';

        for (const line of lines) {
            if (line.startsWith('COMPLETED:')) {
                const completedContent = line.replace('COMPLETED:', '').trim();
                // Split by common delimiters and clean up
                completed.push(...completedContent.split(/[,;]/).map(item => item.trim()).filter(item => item));
            } else if (line.startsWith('NEXT:')) {
                next = line.replace('NEXT:', '').trim();
            }
        }

        return { completed, next };
    }

    /**
     * Parse an insight block
     */
    private static parseInsight(insightBlock: string): ParsedInsight {
        const content = insightBlock.replace(/```insights\n/, '').replace(/\n```/, '');
        const lines = content.split('\n');
        
        let finding = '';
        let data = '';
        let recommendation = '';

        for (const line of lines) {
            if (line.startsWith('FINDING:')) {
                finding = line.replace('FINDING:', '').trim();
            } else if (line.startsWith('DATA:')) {
                data = line.replace('DATA:', '').trim();
            } else if (line.startsWith('RECOMMENDATION:')) {
                recommendation = line.replace('RECOMMENDATION:', '').trim();
            }
        }

        return { finding, data, recommendation };
    }

    /**
     * Format a parsed response for display
     */
    static formatForDisplay(parsed: ParsedResponse): string {
        let formatted = '';

        // Add plans
        if (parsed.plans && parsed.plans.length > 0) {
            formatted += '## 📋 Proposed Plan\n\n';
            parsed.plans.forEach(plan => {
                formatted += `**Plan:** ${plan.plan}\n\n`;
                
                if (plan.steps.length > 0) {
                    formatted += '**Steps:**\n';
                    plan.steps.forEach((step, index) => {
                        formatted += `${index + 1}. ${step}\n`;
                    });
                    formatted += '\n';
                }
                
                if (plan.files.length > 0) {
                    formatted += '**Files to be affected:**\n';
                    plan.files.forEach(file => {
                        formatted += `- \`${file}\`\n`;
                    });
                    formatted += '\n';
                }
                
                if (plan.risks) {
                    formatted += `**Risks/Considerations:** ${plan.risks}\n\n`;
                }
                
                formatted += '**Should I proceed with this plan?**\n\n';
            });
        }

        // Add steps
        if (parsed.steps && parsed.steps.length > 0) {
            formatted += '## Steps Completed\n\n';
            parsed.steps.forEach(step => {
                formatted += `**${step.step}**\n`;
                formatted += `- Action: ${step.action}\n`;
                formatted += `- File: \`${step.file}\`\n\n`;
            });
        }

        // Add patches
        if (parsed.patches && parsed.patches.length > 0) {
            formatted += '## Code Changes\n\n';
            parsed.patches.forEach(patch => {
                formatted += `### ${patch.file}\n`;
                formatted += '```diff\n';
                formatted += patch.changes;
                formatted += '\n```\n\n';
            });
        }

        // Add summaries
        if (parsed.summaries && parsed.summaries.length > 0) {
            formatted += '## Summary\n\n';
            parsed.summaries.forEach(summary => {
                if (summary.completed.length > 0) {
                    formatted += '**Completed:**\n';
                    summary.completed.forEach(item => {
                        formatted += `- ${item}\n`;
                    });
                    formatted += '\n';
                }
                if (summary.next) {
                    formatted += `**Next:** ${summary.next}\n\n`;
                }
            });
        }

        // Add insights
        if (parsed.insights && parsed.insights.length > 0) {
            formatted += '## Insights\n\n';
            parsed.insights.forEach(insight => {
                formatted += `**Finding:** ${insight.finding}\n`;
                if (insight.data) {
                    formatted += `**Data:** ${insight.data}\n`;
                }
                if (insight.recommendation) {
                    formatted += `**Recommendation:** ${insight.recommendation}\n`;
                }
                formatted += '\n';
            });
        }

        // If no structured content, return the raw text
        if (!parsed.hasStructuredContent) {
            return parsed.rawText;
        }

        return formatted;
    }
} 