import { listProperties } from "@/lib/properties";

export const dynamic = "force-dynamic";

export default async function ExportPage() {
  const properties = await listProperties({ limit: 1000 });
  const appId = process.env.NEXT_PUBLIC_KOMMUNICATE_APP_ID;
  const geminiOn = !!process.env.GEMINI_API_KEY;
  const geminiModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Chatbot &amp; Knowledge Export
        </h1>
        <p className="text-sm text-slate-500">
          Export your live property data in the formats Kommunicate accepts, then
          upload them to train your chatbot.
        </p>
      </div>

      {/* Export cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold text-slate-900">Knowledge document (.txt)</h2>
          <p className="mt-2 text-sm text-slate-600">
            A plain-text document with one section per property. Upload this under
            Kommunicate → Manage Bots → Knowledge Source → Upload document. Best for
            free-form questions about listings.
          </p>
          <p className="mt-3 text-xs text-slate-400">
            {properties.length} properties will be included.
          </p>
          <a
            href="/api/export/knowledge"
            className="mt-4 inline-block rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            Download .txt
          </a>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold text-slate-900">FAQ file (.csv)</h2>
          <p className="mt-2 text-sm text-slate-600">
            A two-column <code>Question, Answer</code> CSV — the format used by
            Kommunicate/Dialogflow FAQ knowledge bases. Includes price, location and
            summary questions for every property.
          </p>
          <p className="mt-3 text-xs text-slate-400">
            Auto-generated Q&amp;A pairs from current data.
          </p>
          <a
            href="/api/export/faq"
            className="mt-4 inline-block rounded-lg border border-brand px-4 py-2 text-sm font-semibold text-brand hover:bg-teal-50"
          >
            Download .csv
          </a>
        </div>
      </div>

      {/* Gemini AI status */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="font-semibold text-slate-900">Gemini AI recommendations</h2>
        {geminiOn ? (
          <p className="mt-2 text-sm text-emerald-700">
            ✓ Active. Model <code>{geminiModel}</code> powers recommendation
            ranking and natural-language search, with an automatic content-based
            fallback if a request fails.
          </p>
        ) : (
          <div className="mt-2 space-y-2 text-sm text-slate-600">
            <p>
              Gemini is not configured. The system currently uses the built-in
              content-based recommendation algorithm. To enable AI ranking and
              natural-language search, add your key to <code>.env.local</code>:
            </p>
            <pre className="overflow-x-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">
              GEMINI_API_KEY=your_key_from_aistudio.google.com
            </pre>
            <p>Then restart the dev server.</p>
          </div>
        )}
      </div>

      {/* Kommunicate connection status */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="font-semibold text-slate-900">Kommunicate chat widget</h2>
        {appId ? (
          <p className="mt-2 text-sm text-emerald-700">
            ✓ Connected. App ID <code>{appId}</code> is configured and the widget
            loads on the public site.
          </p>
        ) : (
          <div className="mt-2 space-y-2 text-sm text-slate-600">
            <p>
              The chat widget is ready but not yet connected. When you have your
              Kommunicate App ID, add it to <code>.env.local</code>:
            </p>
            <pre className="overflow-x-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">
              NEXT_PUBLIC_KOMMUNICATE_APP_ID=your_app_id_here
            </pre>
            <p>
              Then restart the dev server. The widget will appear automatically on
              every public page. If you were given a full embed snippet instead of
              an App ID, paste its settings into{" "}
              <code>components/chat-widget.tsx</code>.
            </p>
          </div>
        )}
      </div>

      {/* How the bot uses the DB */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="font-semibold text-slate-900">
          How the bot lists &amp; filters live data
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Beyond the trained knowledge file, the bot (or any integration) can query
          live inventory through the public API, which reads directly from the
          database:
        </p>
        <ul className="mt-3 space-y-1 text-sm text-slate-600">
          <li>
            <code>GET /api/properties?city=Karachi&amp;maxPrice=30000000&amp;type=apartment</code>{" "}
            — filtered listings
          </li>
          <li>
            <code>GET /api/recommendations?propertyId=1</code> — similar properties
          </li>
          <li>
            <code>POST /api/leads</code> — capture &amp; auto-qualify a buyer
          </li>
          <li>
            <code>POST /api/visits</code> — book a visit
          </li>
        </ul>
        <p className="mt-3 text-xs text-slate-400">
          Re-export the knowledge/FAQ files whenever you add or change properties so
          the trained bot stays in sync.
        </p>
      </div>
    </div>
  );
}
