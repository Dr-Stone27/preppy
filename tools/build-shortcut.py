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
U = {k: str(uuid.uuid4()).upper() for k in "ABCDEF"}
actions = [
  {"WFWorkflowActionIdentifier": "is.workflow.actions.downloadurl",
   "WFWorkflowActionParameters": {"UUID": U["A"], "WFURL": tokens([INPUT]), "WFHTTPMethod": "GET", "ShowHeaders": False}},
  {"WFWorkflowActionIdentifier": "is.workflow.actions.text.match",
   "WFWorkflowActionParameters": {"UUID": U["B"], "WFMatchTextPattern": '<meta[^>]*og:description[^>]*>', "WFMatchTextCaseSensitive": False,
                                  "text": tokens([out(U["A"], "Contents of URL")])}},
  {"WFWorkflowActionIdentifier": "is.workflow.actions.text.match",
   "WFWorkflowActionParameters": {"UUID": U["C"], "WFMatchTextPattern": 'content="([^"]*)"', "WFMatchTextCaseSensitive": False,
                                  "text": tokens([out(U["B"], "Matches")])}},
  {"WFWorkflowActionIdentifier": "is.workflow.actions.text.match.getgroup",
   "WFWorkflowActionParameters": {"UUID": U["D"], "matches": attach(out(U["C"], "Matches")), "WFGetGroupType": "Group At Index", "WFGroupIndex": 1}},
  {"WFWorkflowActionIdentifier": "is.workflow.actions.gettext",
   "WFWorkflowActionParameters": {"UUID": U["E"], "WFTextActionText": tokens([INPUT, "\n", out(U["D"], "Group")])}},
  {"WFWorkflowActionIdentifier": "is.workflow.actions.urlencode",
   "WFWorkflowActionParameters": {"UUID": U["F"], "WFEncodeMode": "Encode", "WFInput": attach(out(U["E"], "Text"))}},
  {"WFWorkflowActionIdentifier": "is.workflow.actions.openurl",
   "WFWorkflowActionParameters": {"WFInput": tokens(["https://preppy-liart.vercel.app/add?shared=", out(U["F"], "URL Encoded Text")])}},
]
wf = {
  "WFWorkflowClientVersion": "2607.0.2",
  "WFWorkflowMinimumClientVersion": 900,
  "WFWorkflowMinimumClientVersionString": "900",
  "WFWorkflowIcon": {"WFWorkflowIconStartColor": 4282601983, "WFWorkflowIconGlyphNumber": 59511},
  "WFWorkflowTypes": ["ActionExtension"],
  "WFWorkflowInputContentItemClasses": ["WFURLContentItem", "WFSafariWebPageContentItem", "WFStringContentItem"],
  "WFWorkflowImportQuestions": [],
  "WFWorkflowActions": actions,
  "WFQuickActionSurfaces": [],
  "WFWorkflowHasShortcutInputVariables": True,
}
with open("Save to Preppy.shortcut", "wb") as f: plistlib.dump(wf, f, fmt=plistlib.FMT_BINARY)
print("ok", len(actions))
