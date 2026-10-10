/**
 * Jobs-To-Be-Done (JTBD) Domain Aligner
 * Ensures parent nodes describe customer outcomes and goals rather than internal engineering modules.
 * Kang et al. (1990), Wei et al. (2024), Christensen et al. (Jobs to be Done)
 */

interface JtbdMapping {
  patterns: RegExp[];
  jtbdName: string;
  consumerBenefit: string;
  icon: string;
}

const JTBD_PATTERNS: JtbdMapping[] = [
  {
    patterns: [
      /database|s3|storage|cloud storage|s3 infrastructure|blob|minio|sql|postgres|mongo|dynamodb/i
    ],
    jtbdName: "Data Safety & Peace of Mind",
    consumerBenefit: "Protect critical records with immutable, zero-loss cloud storage.",
    icon: "🔒"
  },
  {
    patterns: [
      /compliance|legal|security|audit|regulatory|tamper|kyc|aml|jurisdiction/i
    ],
    jtbdName: "Legal Compliance & Security",
    consumerBenefit: "Ensure every transaction is audit-ready, legally defensible, and tamper-proof.",
    icon: "🛡️"
  },
  {
    patterns: [
      /sign(ing)? experience|signing flow|speed|mobile sign|signature capture|ceremony/i
    ],
    jtbdName: "Signing Experience & Speed",
    consumerBenefit: "Close agreements in minutes without friction, app downloads, or delays.",
    icon: "⚡"
  },
  {
    patterns: [
      /auth|iam|identity|verification|biometric|credential|login|sso|oauth/i
    ],
    jtbdName: "Signer Trust & Identity Verification",
    consumerBenefit: "Verify signers instantly with government ID match and fraud detection.",
    icon: "👤"
  },
  {
    patterns: [
      /notification|webhook|email|smtp|sms|alert|push service|messaging queue/i
    ],
    jtbdName: "Real-Time Updates & Proactive Alerts",
    consumerBenefit: "Keep all parties informed at every transaction milestone automatically.",
    icon: "🔔"
  },
  {
    patterns: [
      /pdf|document preparation|templating|merge|editor|field tagging/i
    ],
    jtbdName: "Document Preparation & Automation",
    consumerBenefit: "Assemble and tag complex documents in seconds with dynamic smart fields.",
    icon: "📄"
  },
  {
    patterns: [
      /payment|stripe|billing|checkout|invoicing|pos|merchant/i
    ],
    jtbdName: "Seamless Payments & Flexible Checkout",
    consumerBenefit: "Collect transaction fees and escrow deposits right at the point of signing.",
    icon: "💳"
  },
  {
    patterns: [
      /analytics|reporting|dashboard|metrics|telemetry|audit trail analytics/i
    ],
    jtbdName: "Operational Oversight & Performance Analytics",
    consumerBenefit: "Track completion rates, bottlenecks, and notarization metrics in real time.",
    icon: "📊"
  },
  {
    patterns: [
      /api|integration|sdk|webhook infrastructure|rest endpoints|backend connectors/i
    ],
    jtbdName: "Ecosystem & Workflow Integration",
    consumerBenefit: "Embed seamless signing directly into your existing CRMs, ERPs, and portals.",
    icon: "🔗"
  },
  {
    patterns: [
      /ai|machine learning|ocr|auto-fill|intelligent extraction|nlp/i
    ],
    jtbdName: "Intelligent Document Automation",
    consumerBenefit: "Eliminate manual data entry with AI-assisted scanning and verification.",
    icon: "✨"
  }
];

export interface JtbdAnalysis {
  isEngineeringCentric: boolean;
  matchedPattern?: string;
  suggestedName: string;
  consumerBenefit: string;
  icon: string;
}

export function analyzeJtbdAlignment(domainName: string): JtbdAnalysis {
  for (const mapping of JTBD_PATTERNS) {
    for (const pattern of mapping.patterns) {
      if (pattern.test(domainName)) {
        // If the domain is already formulated cleanly as the JTBD name, it's not a violation
        const isExactOrClose = domainName.toLowerCase() === mapping.jtbdName.toLowerCase();
        return {
          isEngineeringCentric: !isExactOrClose,
          matchedPattern: pattern.source,
          suggestedName: mapping.jtbdName,
          consumerBenefit: mapping.consumerBenefit,
          icon: mapping.icon
        };
      }
    }
  }

  // Fallback heuristic: checks if it has words like "backend", "service", "infrastructure", "system", "table"
  const engineeringKeywords = [
    'backend', 'frontend', 'infrastructure', 'microservice', 'service', 'engine', 
    'server', 'pipeline', 'queue', 'crud', 'controller', 'endpoint', 'tables', 'schema'
  ];
  
  const foundKw = engineeringKeywords.find(kw => new RegExp(`\\b${kw}\\b`, 'i').test(domainName));
  if (foundKw) {
    return {
      isEngineeringCentric: true,
      matchedPattern: foundKw,
      suggestedName: `Customer Outcome for ${domainName}`,
      consumerBenefit: "Achieve the core business objective reliably and securely.",
      icon: "🎯"
    };
  }

  return {
    isEngineeringCentric: false,
    suggestedName: domainName,
    consumerBenefit: "Streamline workflows and deliver reliable outcomes.",
    icon: "✨"
  };
}

export function suggestIconForDomain(name: string): string {
  const analysis = analyzeJtbdAlignment(name);
  return analysis.icon || "📁";
}
