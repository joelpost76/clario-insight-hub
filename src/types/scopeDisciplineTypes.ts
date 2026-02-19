export interface ScopeDisciplineResponses {
  estimateVarianceFrequency: string;
  estimateReviewProcess: string;
  estimatingOwnership: string;
  avgChangeApprovalTime: string;
  pmApprovalThreshold: string;
  workBeforePricing: string;
  marginErosionVisibility: string;
  changeOrderMarginTracking: string;
  smallChangeLoggingBehavior: string;
  changeConversationStructure: string;
}

export interface ScopeDisciplineAnalysis {
  scopeIntegritySummary: string;
  marginLeakageMechanism: string;
  changeControlRiskPattern: string;
  disciplineMoves: string[];  // 3–5 concrete control actions
  controlUpgrade: string;     // single highest leverage control improvement
  confidence: "LOW" | "MEDIUM" | "HIGH";
}
