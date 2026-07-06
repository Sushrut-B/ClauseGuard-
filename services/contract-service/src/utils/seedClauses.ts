import { ClauseTemplate } from '../models/clauseTemplate'

export const seedClauseTemplates = async () => {
  const count = await ClauseTemplate.count()
  if (count > 0) return

  await ClauseTemplate.bulkCreate([
    {
      category: 'liability',
      title: 'Mutual Liability Cap',
      description: 'Caps liability for both parties equally at contract value.',
      riskLevel: 'balanced',
      tags: ['mutual', 'cap', 'standard'],
      text: `Each party's liability to the other under this Agreement shall be limited to the total fees paid or payable under this Agreement in the twelve (12) months preceding the claim. This limitation applies to all claims, whether in contract, tort, or otherwise.`,
    },
    {
      category: 'liability',
      title: 'Mutual Indemnification',
      description: 'Both parties indemnify each other for their own negligence.',
      riskLevel: 'safe',
      tags: ['indemnification', 'mutual', 'negligence'],
      text: `Each party shall indemnify, defend, and hold harmless the other party from any claims, damages, or expenses arising from its own negligence, willful misconduct, or breach of this Agreement. Neither party shall be liable for indirect, incidental, or consequential damages.`,
    },
    {
      category: 'liability',
      title: 'Consequential Damages Waiver',
      description: 'Standard mutual waiver of consequential damages.',
      riskLevel: 'balanced',
      tags: ['consequential', 'waiver', 'standard'],
      text: `In no event shall either party be liable to the other for any indirect, incidental, special, consequential, or punitive damages, regardless of the cause of action or the theory of liability, even if such party has been advised of the possibility of such damages.`,
    },
    {
      category: 'termination',
      title: 'Mutual Termination for Convenience',
      description: 'Either party can terminate with reasonable notice.',
      riskLevel: 'safe',
      tags: ['mutual', 'convenience', 'notice'],
      text: `Either party may terminate this Agreement for any reason upon thirty (30) days written notice to the other party. Upon termination, the Company shall pay for all work completed up to the termination date within fourteen (14) days.`,
    },
    {
      category: 'termination',
      title: 'Termination for Cause with Cure Period',
      description: 'Termination only after breach and opportunity to cure.',
      riskLevel: 'safe',
      tags: ['cause', 'cure', 'breach'],
      text: `Either party may terminate this Agreement for material breach if the breaching party fails to cure such breach within thirty (30) days of receiving written notice specifying the breach in reasonable detail. Termination for convenience requires sixty (60) days written notice from either party.`,
    },
    {
      category: 'termination',
      title: 'Balanced Termination with Compensation',
      description: 'Protects contractor with payment on early termination.',
      riskLevel: 'balanced',
      tags: ['compensation', 'early termination', 'protection'],
      text: `The Company may terminate this Agreement with fourteen (14) days written notice. In the event of termination without cause, the Company shall pay the Contractor a termination fee equal to thirty (30) days of the average monthly fees paid in the preceding three months.`,
    },
    {
      category: 'payment',
      title: 'Net-30 Payment Terms',
      description: 'Standard 30-day payment terms with late fees.',
      riskLevel: 'safe',
      tags: ['net-30', 'standard', 'late fees'],
      text: `The Company shall pay all invoices within thirty (30) days of receipt. Invoices not paid within thirty (30) days shall accrue interest at the rate of 1.5% per month. The Company may not withhold payment except in the case of a bona fide dispute, which must be raised in writing within ten (10) days of invoice receipt.`,
    },
    {
      category: 'payment',
      title: 'Milestone-Based Payment',
      description: 'Payment tied to project milestones with clear triggers.',
      riskLevel: 'balanced',
      tags: ['milestone', 'project', 'structured'],
      text: `Payment shall be made in accordance with the milestone schedule set out in Schedule A. Each milestone payment shall be due within fifteen (15) days of the Company's written acceptance of the relevant deliverable. Acceptance shall not be unreasonably withheld or delayed beyond ten (10) business days of delivery.`,
    },
    {
      category: 'payment',
      title: 'Retainer with Expense Reimbursement',
      description: 'Monthly retainer plus reimbursement of pre-approved expenses.',
      riskLevel: 'balanced',
      tags: ['retainer', 'expenses', 'monthly'],
      text: `The Company shall pay the Contractor a monthly retainer of the agreed amount, due on the first business day of each month. Pre-approved expenses shall be reimbursed within fifteen (15) days of submission of receipts. The Company shall not withhold payment for work performed in good faith.`,
    },
    {
      category: 'ip',
      title: 'Work-For-Hire with Carve-Out',
      description: 'Company owns deliverables but contractor retains pre-existing IP.',
      riskLevel: 'balanced',
      tags: ['work-for-hire', 'carve-out', 'pre-existing'],
      text: `All work product specifically created for the Company under this Agreement shall be considered work-for-hire and owned by the Company. Notwithstanding the foregoing, the Contractor retains all rights to pre-existing intellectual property, tools, frameworks, and methodologies used in the creation of deliverables, and hereby grants the Company a non-exclusive license to use such pre-existing IP solely as incorporated in the deliverables.`,
    },
    {
      category: 'ip',
      title: 'Contractor Retains IP, Grants License',
      description: 'Contractor owns all IP and grants company a broad license.',
      riskLevel: 'safe',
      tags: ['license', 'contractor-owns', 'perpetual'],
      text: `The Contractor retains all intellectual property rights in all work product created under this Agreement. The Contractor grants the Company a perpetual, worldwide, non-exclusive, royalty-free license to use, modify, and distribute the work product for its internal business purposes. This license shall survive termination of this Agreement.`,
    },
    {
      category: 'ip',
      title: 'Scope-Limited Assignment',
      description: 'IP assignment limited to work created during business hours using company resources.',
      riskLevel: 'balanced',
      tags: ['assignment', 'scope-limited', 'business hours'],
      text: `The Contractor assigns to the Company all intellectual property rights in work product created specifically for the Company during the term of this Agreement, using Company resources or on Company time. Work created by the Contractor on their own time, using their own resources, and unrelated to the Company's business, shall remain the Contractor's property.`,
    },
    {
      category: 'dispute',
      title: 'Mutual Jurisdiction Selection',
      description: 'Both parties agree on a neutral jurisdiction for disputes.',
      riskLevel: 'balanced',
      tags: ['jurisdiction', 'mutual', 'neutral'],
      text: `Any disputes arising from this Agreement shall be governed by the laws of [NEUTRAL JURISDICTION], without regard to conflict of law principles. Both parties consent to the exclusive jurisdiction of the courts of [NEUTRAL JURISDICTION] for resolution of any disputes.`,
    },
    {
      category: 'dispute',
      title: 'Mediation Before Arbitration',
      description: 'Requires good-faith mediation before escalating to arbitration.',
      riskLevel: 'safe',
      tags: ['mediation', 'arbitration', 'escalation'],
      text: `The parties agree to attempt to resolve any dispute through good-faith negotiation for thirty (30) days. If unresolved, the parties shall submit the dispute to non-binding mediation before a mutually agreed mediator. Only if mediation fails shall either party pursue arbitration or litigation. Each party shall bear its own costs in mediation.`,
    },
    {
      category: 'dispute',
      title: 'Balanced Arbitration Clause',
      description: 'Fair arbitration with cost sharing and location flexibility.',
      riskLevel: 'balanced',
      tags: ['arbitration', 'cost-sharing', 'fair'],
      text: `Any dispute arising from this Agreement shall be resolved by binding arbitration under the rules of [ARBITRATION BODY]. The arbitration shall take place in a location mutually agreed by the parties, or via video conference if no agreement is reached. Costs of arbitration shall be shared equally unless the arbitrator determines otherwise. Each party retains the right to seek injunctive relief in any court of competent jurisdiction.`,
    },
  ])

  console.log('Clause templates seeded.')
}