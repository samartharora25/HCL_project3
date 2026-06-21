// Taxonomy seed from specifications
export const SEED_TAXONOMY: Record<string, string[]> = {
  "Programming & Full-Stack Dev": ["Java", "Java Full Stack", ".NET", ".Net", ".NET Core", ".NetCore", "Angular", "React", "Node", "Python", "C++", "Android", "Spring Boot"],
  "SAP": ["SAP", "SAP ABAP", "SAP ABAP on HANA", "SAP FICO", "SAP Basis", "SAP ECC", "SAP BTP"],
  "Cloud & Data Engineering": ["AWS", "Azure", "GCP", "Google Cloud Platform", "Azure Data Factory", "Databricks", "Apache Spark", "Apache Kafka", "AWS Glue"],
  "Enterprise Platforms (CRM/ERP/PLM)": ["Salesforce", "Pega", "Microsoft Dynamics 365", "Adobe Experience Manager", "Appian", "Guidewire"],
  "Testing & QA": ["Manual Testing", "Functional Testing", "Selenium", "Automation Testing", "API Testing", "Tricentis Tosca", "Cucumber"],
  "PM/BA & Agile": ["Business Analysis", "Project Management", "Program Management", "Scrum", "SAFe Agile"],
  "DevOps & SRE": ["DevOps", "Azure DevOps", "Kubernetes", "CI/CD", "Site Reliability Engineering"],
  "Data Science & AI/ML": ["Data Science", "Machine Learning", "AI/ML Modelling", "Gen AI"],
  "Integration & API Management": ["Mulesoft", "Boomi", "Azure API Management", "Oracle Integration Cloud", "WebMethods"],
  "Databases & ERP": ["Oracle", "Oracle ERP Cloud", "Oracle Financial Cloud"],
  "Legacy & Core Systems": ["COBOL", "AS/400", "Mainframe", "DB2"],
  "UI/UX & Low-code": ["Power Apps", "Power Automate", "SharePoint Framework", "UI/UX Design Systems"]
};

const UNMAPPED = "Unmapped — Needs Review";
const OTHER = "Other / Emerging Skills";

/**
 * Normalizes an existing cluster label to match our taxonomy.
 */
function normalizeClusterLabel(label: string): string {
  const lowerLabel = label.trim().toLowerCase();
  
  // Find exact case-insensitive match in taxonomy keys
  const exactMatch = Object.keys(SEED_TAXONOMY).find(
    key => key.toLowerCase() === lowerLabel
  );
  if (exactMatch) return exactMatch;
  
  return label.trim(); // Return as is if no direct mapping, it's considered a valid cluster.
}

/**
 * Clusters a raw skill string based on seed keywords.
 */
export function clusterSkill(rawSkill: string, existingClusterLabel?: string): string {
  if (existingClusterLabel && existingClusterLabel.trim()) {
    return normalizeClusterLabel(existingClusterLabel);
  }
  
  if (!rawSkill || !rawSkill.trim()) return UNMAPPED;
  
  const lowerSkill = rawSkill.trim().toLowerCase();
  
  for (const [cluster, keywords] of Object.entries(SEED_TAXONOMY)) {
    for (const keyword of keywords) {
      if (lowerSkill.includes(keyword.toLowerCase())) {
        return cluster;
      }
    }
  }
  
  return UNMAPPED;
}

/**
 * Aggregates clusters and collapses low-volume clusters into "Other / Emerging Skills".
 */
export function thresholdClusters(
  records: { skillCluster: string }[],
  thresholdPercent: number = 0.01
): Record<string, string> {
  const total = records.length;
  if (total === 0) return {};
  
  const counts: Record<string, number> = {};
  records.forEach(r => {
    counts[r.skillCluster] = (counts[r.skillCluster] || 0) + 1;
  });
  
  const threshold = total * thresholdPercent;
  
  const clusterMapping: Record<string, string> = {};
  for (const cluster of Object.keys(counts)) {
    // Unmapped should remain unmapped, regardless of threshold
    if (cluster === UNMAPPED) {
      clusterMapping[cluster] = UNMAPPED;
    } else if (counts[cluster] < threshold) {
      clusterMapping[cluster] = OTHER;
    } else {
      clusterMapping[cluster] = cluster;
    }
  }
  
  return clusterMapping;
}
