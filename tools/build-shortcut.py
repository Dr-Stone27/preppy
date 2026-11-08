"""
Builds the "Save to Preppy" iPhone Shortcut. On the phone it fetches the shared Instagram post,
takes the caption from the page's og:description, and opens Preppy's Add screen with both filled in.
Rebuild and sign on a Mac:
  python3 tools/build-shortcut.py
  shortcuts sign --mode anyone --input "Save to Preppy.shortcut" --output public/save-to-preppy.shortcut
"""
import plistlib, uuid
OBJ = "￼"
def out(u, name): return {"Type": "ActionOutput", "OutputUUID": u, "OutputName": name}
INPUT = {"Type": "ExtensionInput"}
def attach(v): return {"Value": v, "WFSerializationType": "WFTextTokenAttachment"}
def tokens(parts):
    s, att = "", {}
    for p in parts:
        if isinstance(p, str): s += p
        else:
            att[f"{{{len(s)}, 1}}"] = p; s += OBJ
    return {"Value": {"string": s, "attachmentsByRange": att}, "WFSerializationType": "WFTextTokenString"}
import sys
DEBUG = "--debug" in sys.argv  # ends on the finished address instead of opening it, for testing with `shortcuts run`
# Bump with every change, together with SHORTCUT_VERSION in src/components/add/FromInstagram.tsx.
VERSION = 6
SITE = next((x.split("=", 1)[1] for x in sys.argv if x.startswith("--site=")), "https://preppy-liart.vercel.app")
U = {k: str(uuid.uuid4()).upper() for k in "ARMTNSUVWCEFG"}
# Tested with `shortcuts run` against a page shaped like an Instagram post (8–9 Nov 2026). Two things matter:
#  - The fetched page is renamed to page.txt before matching; otherwise Shortcuts turns it into readable text and the
#    <meta> tags holding the caption are gone.
#  - URL Encode and Open URLs take their input as a text token string. As a plain variable attachment they came out empty.
def meta(attr, name):
  # The content of <meta attr="name" content="…">, whichever order the attributes come in.
  return rf'(?<={attr}="{name}" content=")[^"]*|(?<=content=")[^"]*(?="\s+{attr}="{name}")'
# Instagram trims the caption in og:description but often keeps more of it in og:title, so all three are sent
# and Preppy keeps the longest. SEP must match SHARED_SEP in src/domain/recipes/import.ts.
SEP = "\n---preppy---\n"
actions = [
  # 1. Fetch the shared post's page, as the phone, and keep it as raw text.
  {"WFWorkflowActionIdentifier": "is.workflow.actions.downloadurl",
   "WFWorkflowActionParameters": {"UUID": U["A"], "WFURL": tokens([INPUT])}},
  {"WFWorkflowActionIdentifier": "is.workflow.actions.setitemname",
   "WFWorkflowActionParameters": {"UUID": U["R"], "WFName": "page.txt", "WFInput": attach(out(U["A"], "Contents of URL"))}},
  # 2. The caption, from the three places post pages carry it.
  *[{"WFWorkflowActionIdentifier": "is.workflow.actions.text.match",
     "WFWorkflowActionParameters": {"UUID": U[k], "WFMatchTextPattern": meta(attr, name), "WFMatchTextCaseSensitive": False,
                                    "text": tokens([out(U["R"], "Renamed Item")])}}
    for k, attr, name in [("M", "property", "og:description"), ("T", "property", "og:title"), ("N", "name", "description")]],
  # 3. Instagram only: the official embed page (/p/<code>/embed/captioned/) carries the whole caption, which the page
  #    summaries above cut after a line or two. Checked against a long-caption reel on 9 Nov 2026. TikTok links don't
  #    match the code pattern, so these steps come out empty for them.
  {"WFWorkflowActionIdentifier": "is.workflow.actions.text.match",
   "WFWorkflowActionParameters": {"UUID": U["S"], "WFMatchTextPattern": r'(?<=instagram\.com/(p|reel|reels|tv)/)[A-Za-z0-9_-]+', "text": tokens([INPUT])}},
  {"WFWorkflowActionIdentifier": "is.workflow.actions.gettext",
   "WFWorkflowActionParameters": {"UUID": U["U"], "WFTextActionText": tokens(["https://www.instagram.com/p/", out(U["S"], "Matches"), "/embed/captioned/"])}},
  {"WFWorkflowActionIdentifier": "is.workflow.actions.downloadurl",
   "WFWorkflowActionParameters": {"UUID": U["V"], "WFURL": tokens([out(U["U"], "Text")])}},
  {"WFWorkflowActionIdentifier": "is.workflow.actions.setitemname",
   "WFWorkflowActionParameters": {"UUID": U["W"], "WFName": "embed.txt", "WFInput": attach(out(U["V"], "Contents of URL"))}},
  {"WFWorkflowActionIdentifier": "is.workflow.actions.text.match",
   "WFWorkflowActionParameters": {"UUID": U["C"], "WFMatchTextPattern": r'(?<=class="Caption">)[\s\S]*?(?=</div>)', "text": tokens([out(U["W"], "Renamed Item")])}},
  # 4. "link<newline>caption versions", URL-encoded, after # in the Preppy address. A long caption makes this ~12 KB;
  #    after # it stays in the browser and never meets the server's limit on address length.
  {"WFWorkflowActionIdentifier": "is.workflow.actions.gettext",
   "WFWorkflowActionParameters": {"UUID": U["E"], "WFTextActionText": tokens([INPUT, "\n", out(U["M"], "Matches"), SEP, out(U["T"], "Matches"), SEP, out(U["N"], "Matches"), SEP, out(U["C"], "Matches")])}},
  {"WFWorkflowActionIdentifier": "is.workflow.actions.urlencode",
   "WFWorkflowActionParameters": {"UUID": U["F"], "WFEncodeMode": "Encode", "WFInput": tokens([out(U["E"], "Text")])}},
  {"WFWorkflowActionIdentifier": "is.workflow.actions.gettext",
   "WFWorkflowActionParameters": {"UUID": U["G"], "WFTextActionText": tokens([SITE + f"/add#v={VERSION}&shared=", out(U["F"], "URL Encoded Text")])}},
]
if not DEBUG:
  actions.append({"WFWorkflowActionIdentifier": "is.workflow.actions.openurl",
                  "WFWorkflowActionParameters": {"WFInput": tokens([out(U["G"], "Text")])}})

wf = {
  "WFWorkflowClientVersion": "2607.0.2",
  "WFWorkflowMinimumClientVersion": 900,
  "WFWorkflowMinimumClientVersionString": "900",
  "WFWorkflowIcon": {"WFWorkflowIconStartColor": 4282601983, "WFWorkflowIconGlyphNumber": 59511},
  "WFWorkflowTypes": [] if DEBUG else ["ActionExtension"],
  "WFWorkflowInputContentItemClasses": ["WFURLContentItem", "WFSafariWebPageContentItem", "WFStringContentItem"],
  "WFWorkflowImportQuestions": [],
  "WFWorkflowActions": actions,
  "WFQuickActionSurfaces": [],
  "WFWorkflowHasShortcutInputVariables": True,
}
name = "Preppy Shortcut Test" if DEBUG else "Save to Preppy"
with open(f"{name}.shortcut", "wb") as f: plistlib.dump(wf, f, fmt=plistlib.FMT_BINARY)
print("ok", len(actions))
