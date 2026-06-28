import { EmailSummary } from "@/lib/types";

export default function EmailList({ emails }: { emails: EmailSummary[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {emails.map((email) => (
        <li key={email.id}>
          <a href={email.link} target="_blank" rel="noreferrer" className="block">
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className={email.unread ? "text-slate font-semibold" : "text-slate"}>
                {email.from.split("<")[0].trim()}
              </span>
              {email.starred && <span className="text-gold">★</span>}
            </div>
            <p className="text-slate-light/70 text-xs truncate">
              {email.subject}
            </p>
          </a>
        </li>
      ))}
    </ul>
  );
}
