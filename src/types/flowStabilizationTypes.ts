export interface FlowStabilizationResponses {
  releaseReadinessCriteria: string;
  releaseAuthority: string;
  capacityCheckMethod: string;
  pmCapacityEstimate: string;
  capacityVisibilityLocation: string;
  changeOrderFlow: string;
  approvalToFieldDelay: string;
  scheduleControlMeeting: string;
  decisionReopenFrequency: string;
}

export interface FlowStabilizationAnalysis {
  flowRiskSummary: string;
  readinessGap: string;
  stabilizationMoves: string[];  // 3–5 concrete actions
  firstDesignMove: string;       // single highest leverage action
  confidence: "LOW" | "MEDIUM" | "HIGH";
}
