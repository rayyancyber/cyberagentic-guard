import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Flag, Trophy, Lock, Unlock, Clock, CheckCircle2, Target, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PageHeader, Panel, Stat, Chip, Empty, Field } from "@/components/cg/kit";
import { useRows, useSave, useMe } from "@/lib/data";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/_authenticated/ctf")({
  head: () => ({ meta: [{ title: "CTF Challenges — CYBERGUARD X" }] }),
  component: CTF,
});

type Challenge = {
  id: string;
  title: string;
  description: string;
  category: "Web" | "Crypto" | "Binary" | "Forensics" | "OSINT" | "Network" | "Misc";
  difficulty: "Easy" | "Medium" | "Hard" | "Insane";
  points: number;
  flag: string; // Server-side validation would hash this
  hints: string[];
  tags: string[];
  author: string;
  solves: number;
};

// CTF Challenges Database
const CHALLENGES: Challenge[] = [
  // Web Exploitation
  {
    id: "web-01",
    title: "Hidden Admin Panel",
    description: "Find the secret admin panel URL by analyzing the robots.txt file and directory structure.",
    category: "Web",
    difficulty: "Easy",
    points: 100,
    flag: "CG{r0b0ts_t3ll_s3cr3ts}",
    hints: [
      "Check robots.txt for disallowed paths",
      "Admin panels often have predictable names",
    ],
    tags: ["directory-traversal", "recon"],
    author: "CyberGuard Team",
    solves: 0,
  },
  {
    id: "web-02",
    title: "SQL Injection Login Bypass",
    description: "Bypass authentication using SQL injection on the login form. The flag is in the admin's profile.",
    category: "Web",
    difficulty: "Easy",
    points: 150,
    flag: "CG{1nj3ct10n_byp4ss_w1n}",
    hints: [
      "Try classic SQL injection payloads in username field",
      "Look for ' OR 1=1 -- patterns",
    ],
    tags: ["sqli", "authentication-bypass"],
    author: "CyberGuard Team",
    solves: 0,
  },
  {
    id: "web-03",
    title: "XSS Cookie Stealer",
    description: "Exploit a reflected XSS vulnerability to steal the admin's session cookie. Flag is in the cookie value.",
    category: "Web",
    difficulty: "Medium",
    points: 200,
    flag: "CG{st0l3n_c00k13s_t4sty}",
    hints: [
      "Test all input fields for XSS",
      "Use document.cookie to access cookies",
      "Reflected XSS shows output immediately",
    ],
    tags: ["xss", "cookie-theft"],
    author: "CyberGuard Team",
    solves: 0,
  },
  {
    id: "web-04",
    title: "JWT Token Forgery",
    description: "The application uses JWT tokens with a weak secret. Forge an admin token to access the flag endpoint.",
    category: "Web",
    difficulty: "Hard",
    points: 300,
    flag: "CG{jw7_s3cr3t_cr4ck3d}",
    hints: [
      "Decode the JWT to see its structure",
      "Try common weak secrets: secret, password, 123456",
      "Use jwt.io or PyJWT to forge tokens",
    ],
    tags: ["jwt", "crypto", "authentication"],
    author: "CyberGuard Team",
    solves: 0,
  },

  // Cryptography
  {
    id: "crypto-01",
    title: "Caesar Cipher",
    description: "Decrypt this message: 'FT{fdhvdu_flskhu_wr_eorrg}'. The flag format is CG{...}",
    category: "Crypto",
    difficulty: "Easy",
    points: 75,
    flag: "CG{caesar_cipher_is_blood}",
    hints: [
      "Caesar cipher shifts each letter by a fixed amount",
      "Try all 26 possible shifts",
    ],
    tags: ["classical-crypto", "substitution"],
    author: "CyberGuard Team",
    solves: 0,
  },
  {
    id: "crypto-02",
    title: "Base64 Layers",
    description: "Decode this: 'UTBkcGRISmZNV05VUkY5Nk9WOTNNVFV6YmpCZlJHVmphMjlrWldRPQ=='",
    category: "Crypto",
    difficulty: "Easy",
    points: 100,
    flag: "CG{b4s364_1s_n0t_3ncrypt10n}",
    hints: [
      "This is base64 encoded multiple times",
      "Decode until you get readable text",
    ],
    tags: ["encoding", "base64"],
    author: "CyberGuard Team",
    solves: 0,
  },
  {
    id: "crypto-03",
    title: "RSA Weak Modulus",
    description: "Factor the RSA modulus n=143 (p and q are small primes). Decrypt the message to get the flag.",
    category: "Crypto",
    difficulty: "Medium",
    points: 250,
    flag: "CG{f4ct0r1ng_sm4ll_pr1m3s}",
    hints: [
      "143 = p * q where p and q are small primes",
      "Try dividing by primes: 2, 3, 5, 7, 11, 13...",
      "Once factored, compute private key d",
    ],
    tags: ["rsa", "factorization"],
    author: "CyberGuard Team",
    solves: 0,
  },

  // Binary Exploitation
  {
    id: "binary-01",
    title: "Buffer Overflow 101",
    description: "A simple buffer overflow challenge. Overwrite the return address to call the win() function.",
    category: "Binary",
    difficulty: "Medium",
    points: 250,
    flag: "CG{buff3r_0v3rfl0w_b4s1cs}",
    hints: [
      "The buffer is 64 bytes",
      "Return address is right after the buffer",
      "Use pattern_create to find offset",
    ],
    tags: ["buffer-overflow", "pwn"],
    author: "CyberGuard Team",
    solves: 0,
  },
  {
    id: "binary-02",
    title: "Format String Vulnerability",
    description: "Exploit a format string bug to read the flag from memory.",
    category: "Binary",
    difficulty: "Hard",
    points: 350,
    flag: "CG{f0rm4t_str1ng_l34k}",
    hints: [
      "Use %x to dump stack memory",
      "Try %s to read string pointers",
      "Flag is on the stack",
    ],
    tags: ["format-string", "memory-leak"],
    author: "CyberGuard Team",
    solves: 0,
  },

  // Forensics
  {
    id: "forensics-01",
    title: "Hidden in Plain Sight",
    description: "The flag is hidden in the image metadata. Extract it using exiftool or similar.",
    category: "Forensics",
    difficulty: "Easy",
    points: 100,
    flag: "CG{3x1f_d4t4_l34ks}",
    hints: [
      "Use exiftool to view all metadata",
      "Check comment, copyright, and custom fields",
    ],
    tags: ["metadata", "steganography"],
    author: "CyberGuard Team",
    solves: 0,
  },
  {
    id: "forensics-02",
    title: "Deleted File Recovery",
    description: "A file was deleted from the disk image. Recover it to find the flag.",
    category: "Forensics",
    difficulty: "Medium",
    points: 200,
    flag: "CG{r3c0v3r3d_d3l3t3d_f1l3}",
    hints: [
      "Use Autopsy or foremost to carve files",
      "Look for file signatures (magic bytes)",
    ],
    tags: ["disk-forensics", "file-carving"],
    author: "CyberGuard Team",
    solves: 0,
  },

  // OSINT
  {
    id: "osint-01",
    title: "Social Media Footprint",
    description: "Find the person's location from their social media posts. Username: @cyberguard_user",
    category: "OSINT",
    difficulty: "Easy",
    points: 100,
    flag: "CG{0s1nt_f1nd5_3v3ryth1ng}",
    hints: [
      "Check photo geotags",
      "Look for landmarks in background",
      "Search username across platforms",
    ],
    tags: ["osint", "geolocation"],
    author: "CyberGuard Team",
    solves: 0,
  },

  // Network
  {
    id: "network-01",
    title: "Packet Analysis",
    description: "Analyze the PCAP file to find the flag transmitted in cleartext.",
    category: "Network",
    difficulty: "Easy",
    points: 125,
    flag: "CG{p4ck3t_sn1ff1ng_101}",
    hints: [
      "Open in Wireshark",
      "Follow TCP streams",
      "Look for HTTP or unencrypted traffic",
    ],
    tags: ["wireshark", "pcap"],
    author: "CyberGuard Team",
    solves: 0,
  },
  {
    id: "network-02",
    title: "ARP Spoofing Detection",
    description: "Identify the attacker's MAC address from the ARP poisoning attack in the packet capture.",
    category: "Network",
    difficulty: "Medium",
    points: 200,
    flag: "CG{4rp_sp00f1ng_d3t3ct3d}",
    hints: [
      "Look for duplicate IP addresses",
      "Check ARP request/reply patterns",
      "Attacker's MAC appears with multiple IPs",
    ],
    tags: ["arp", "mitm"],
    author: "CyberGuard Team",
    solves: 0,
  },

  // Misc
  {
    id: "misc-01",
    title: "QR Code Secret",
    description: "Scan the QR code to reveal the hidden message.",
    category: "Misc",
    difficulty: "Easy",
    points: 50,
    flag: "CG{qr_c0d3s_4r3_3z}",
    hints: [
      "Use any QR code scanner app",
      "Or use zbarimg command line tool",
    ],
    tags: ["qr-code"],
    author: "CyberGuard Team",
    solves: 0,
  },
];

const difficultyColor = {
  Easy: "defense",
  Medium: "warn",
  Hard: "offense",
  Insane: "offense",
} as const;

const categoryColor = {
  Web: "primary",
  Crypto: "warn",
  Binary: "offense",
  Forensics: "defense",
  OSINT: "muted",
  Network: "primary",
  Misc: "muted",
} as const;

function FlagSubmit({ challenge, onSuccess }: { challenge: Challenge; onSuccess: () => void }) {
  const [flag, setFlag] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    setTimeout(() => {
      if (flag.trim() === challenge.flag) {
        toast.success(`Correct! +${challenge.points} points`);
        onSuccess();
      } else {
        toast.error("Incorrect flag. Try again!");
      }
      setSubmitting(false);
      setFlag("");
    }, 500);
  };

  return (
    <form onSubmit={submit} className="flex gap-2">
      <Input
        placeholder="CG{...}"
        value={flag}
        onChange={(e) => setFlag(e.target.value)}
        required
        className="font-mono text-sm"
      />
      <Button type="submit" disabled={submitting}>
        {submitting ? "Checking..." : "Submit"}
      </Button>
    </form>
  );
}

function CTF() {
  const me = useMe();
  const progress = useRows("progress");
  const save = useSave("progress");

  const userId = me.data?.user.id;
  const myProgress = (progress.data ?? []).filter((p) => p.user_id === userId && p.kind === "scenario");

  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("All");
  const [expandedChallenge, setExpandedChallenge] = useState<string | null>(null);
  const [revealedHints, setRevealedHints] = useState<Record<string, number>>({});

  const getSolve = (challengeId: string) => myProgress.find((p) => p.item_key === challengeId);
  const isSolved = (challengeId: string) => getSolve(challengeId)?.completed ?? false;

  const handleFlagSubmit = (challenge: Challenge) => {
    if (!userId) {
      toast.error("Please sign in to submit flags");
      return;
    }

    const existing = getSolve(challenge.id);
    if (existing) {
      save.mutate({ id: existing.id, values: { completed: true, score: challenge.points } });
    } else {
      save.mutate({
        values: {
          user_id: userId,
          item_key: challenge.id,
          kind: "scenario" as const,
          completed: true,
          score: challenge.points,
        },
      });
    }

    // Increment challenge solve count (would be server-side in production)
    challenge.solves += 1;
  };

  const revealHint = (challengeId: string) => {
    const current = revealedHints[challengeId] ?? 0;
    const challenge = CHALLENGES.find((c) => c.id === challengeId);
    if (challenge && current < challenge.hints.length) {
      setRevealedHints({ ...revealedHints, [challengeId]: current + 1 });
      toast.info(`Hint ${current + 1} revealed!`);
    }
  };

  const filtered = CHALLENGES.filter((c) => {
    const catMatch = selectedCategory === "All" || c.category === selectedCategory;
    const diffMatch = selectedDifficulty === "All" || c.difficulty === selectedDifficulty;
    return catMatch && diffMatch;
  });

  const solvedCount = CHALLENGES.filter((c) => isSolved(c.id)).length;
  const totalPoints = CHALLENGES.filter((c) => isSolved(c.id)).reduce((s, c) => s + c.points, 0);
  const availablePoints = CHALLENGES.reduce((s, c) => s + c.points, 0);

  const categories = ["All", ...Array.from(new Set(CHALLENGES.map((c) => c.category)))];
  const difficulties = ["All", "Easy", "Medium", "Hard", "Insane"];

  return (
    <>
      <PageHeader
        title="CTF Challenges"
        subtitle="Capture The Flag challenges across web, crypto, binary, forensics, OSINT, and network categories."
        actions={
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-warning" />
            <span className="font-mono text-sm font-semibold">
              {totalPoints} / {availablePoints} pts
            </span>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat label="Total Challenges" value={CHALLENGES.length} />
        <Stat label="Solved" value={solvedCount} tone="ok" />
        <Stat label="Points" value={totalPoints} tone="ok" hint={`of ${availablePoints}`} />
        <Stat
          label="Completion"
          value={`${Math.round((solvedCount / CHALLENGES.length) * 100)}%`}
          tone={solvedCount === CHALLENGES.length ? "ok" : "warn"}
        />
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
          <span>Overall progress</span>
          <span>
            {solvedCount} of {CHALLENGES.length} challenges
          </span>
        </div>
        <Progress value={(solvedCount / CHALLENGES.length) * 100} className="h-2" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <div className="flex gap-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="border-l mx-2" />
        <div className="flex gap-1">
          {difficulties.map((diff) => (
            <button
              key={diff}
              onClick={() => setSelectedDifficulty(diff)}
              className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                selectedDifficulty === diff
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {diff}
            </button>
          ))}
        </div>
      </div>

      {/* Challenges Grid */}
      {filtered.length === 0 ? (
        <Empty title="No challenges match filters">Try different category or difficulty.</Empty>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((challenge) => {
            const solved = isSolved(challenge.id);
            const expanded = expandedChallenge === challenge.id;
            const hintsRevealed = revealedHints[challenge.id] ?? 0;

            return (
              <div
                key={challenge.id}
                className={`rounded-xl border transition-all ${
                  solved ? "border-defense/40 bg-defense/5" : "bg-card hover:border-primary/40"
                }`}
              >
                <div className="p-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      {solved ? (
                        <CheckCircle2 className="h-5 w-5 text-defense shrink-0" />
                      ) : (
                        <Lock className="h-5 w-5 text-muted-foreground shrink-0" />
                      )}
                      <div>
                        <div className="font-medium text-sm leading-tight">{challenge.title}</div>
                        <div className="text-xs text-muted-foreground">{challenge.author}</div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="font-mono text-xs font-semibold text-warning">
                        {challenge.points}pts
                      </span>
                      <Chip tone={difficultyColor[challenge.difficulty] as any}>
                        {challenge.difficulty}
                      </Chip>
                    </div>
                  </div>

                  {/* Category & Tags */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    <Chip tone={categoryColor[challenge.category] as any}>{challenge.category}</Chip>
                    {challenge.tags.slice(0, 2).map((tag) => (
                      <Chip key={tag} tone="muted">
                        {tag}
                      </Chip>
                    ))}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                    {challenge.description}
                  </p>

                  {/* Solves */}
                  <div className="text-xs text-muted-foreground mb-3">
                    <Target className="h-3 w-3 inline mr-1" />
                    {challenge.solves} solves
                  </div>

                  {/* Actions */}
                  {!solved && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-full"
                      onClick={() => setExpandedChallenge(expanded ? null : challenge.id)}
                    >
                      {expanded ? "Hide Details" : "Attempt Challenge"}
                    </Button>
                  )}
                </div>

                {/* Expanded Details */}
                {expanded && !solved && (
                  <div className="border-t p-4 space-y-4">
                    {/* Full Description */}
                    <div>
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                        Challenge Details
                      </div>
                      <p className="text-sm">{challenge.description}</p>
                    </div>

                    {/* Hints */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Hints ({hintsRevealed}/{challenge.hints.length})
                        </div>
                        {hintsRevealed < challenge.hints.length && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => revealHint(challenge.id)}
                            className="text-xs h-6"
                          >
                            <Zap className="h-3 w-3 mr-1" />
                            Reveal Hint
                          </Button>
                        )}
                      </div>
                      {hintsRevealed > 0 && (
                        <div className="space-y-1">
                          {challenge.hints.slice(0, hintsRevealed).map((hint, i) => (
                            <div
                              key={i}
                              className="text-xs bg-muted/50 rounded p-2 flex items-start gap-2"
                            >
                              <span className="font-mono text-primary shrink-0">{i + 1}.</span>
                              <span>{hint}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Flag Submission */}
                    <div>
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                        Submit Flag
                      </div>
                      <FlagSubmit challenge={challenge} onSuccess={() => handleFlagSubmit(challenge)} />
                    </div>
                  </div>
                )}

                {/* Solved Badge */}
                {solved && (
                  <div className="border-t bg-defense/10 px-4 py-3">
                    <div className="flex items-center gap-2 text-defense">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-sm font-medium">Solved! +{challenge.points} points</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
