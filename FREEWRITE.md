Loupystudio software presents...
# The Freemake suite

Freemake suite is a collection of free, open source software solutions aimed at allowing users to freely collaborate on complex projects. We want to provide a collection of tools that will streamline workflows by adding real-time collaboration to the tools we are using ourselves.
Freeware suite is set to includes:
- Freewrite (collaborative branching narrative writing)
- Freecap (multiplayer motion capture & cutscene editor for Unity & Blender)
- Freecode (collaborative in-line & visual scripting editor with support for UVS, UDON, C#, JS, Python, LUA and more, autocompletion, WYSIWYG script editing for various game engines like Godot/Unity)

These tools are set to complete the collaborative itch that others like AIWE or Suhina aim to help with already.

## Freewrite

Freewrite is a FOSS branching narrative editor & project planning tool, aimed at indy teams looking for a free & scalable solution to collaborative writing.
Freewrite currently supports the creation & edition of GDDs and branching dialogues, useful for RPGs, VNs, P&C, etc etc...
In the future, we are planning to add direct support for Naninovel and Dialogue System for Unity (amongst other things), and will integrate new tools such as level planning, timelines, cutscene planning, and more!

### What's next?

- Add support for in-editor CAT (translation)
- Add configurable keybinds & ability to export settings as json
- Multiple selection with click drag
- Add markdown for comments
- Add chat
- Add UI sounds (move, select, select node that is being edited/locked, new node, node deleted, etc)
- Save projects in .fwdb (FreeWrightDataBase) to take less space
- Export directly to Unity
- Add more visual options, such as more connection types (angular, wire, motherboard)
- Add better visualization with wire coloring & width depending on priority or status

### Planned features

- GDD/Markdown "regular" text editor with real-time collaboration
	- Markdown todo lists
	- Markdown tables
	- Kanbans
	- Usability close to Articy's document editor, with ability to hide sections (click on a title to collapse the section underneath) & reference/link items
	- Timeline of events, similar to Drafft's
- Real-time conversion of in-line VN/play formats to/from node formats
- Export to more formats
	- Moodboards (TLDraw, PureRef)
	- Play (for VAs & more)
	- HTML5 (renders a conversation or game as HTML5 file to send a playtest without compiling in Unity or sending the whole .fwdb file)
- Collaboration features & settings
	- File locking (to avoid accidental edit), off by default
	- Multiple collaborator roles from the collaborate menu
		- Read-only
			- Can access all files, but not edit
		- Writer
			- Can edit all files, like conversations
			- Cannot delete or edit locked files
		- Manager
			- Can lock/unlock files/conversations/etc
		- Host
			- Can change permissions, room password (default is none), etc
	- Show mouse for other users (different color, depends on user's prefered color)
	- Real-time chat with a ping & new message sound
	- Short instructions on how to host a room (port forwarding) when in the collaborate section, with optional UPnP and IP/port display
- Actors, with NPC/PC toggle, designated VAs, etc (integrates directly with Dialogue System For Unity's)
- Items (integrates directly with Dialogue System For Unity's)
- Mapping screen similar to Articy's
- Ability to freehand draw in the dialogues (not exported to supported formats except moodboards, just for reference & collaboration purposes, project-wide option to make those either temporary or saved)
- Conversation templates (any conv can be saved as a template & loaded from a list when creating a new conversation)
- LUA scripting using the Dialogue System for Unity as reference (see online docs)
- Fun & productivity features
	- UI sounds with variations & themes
	- UI visual themes (Frutiger, 2010s gradiant, minimalist, focused, pure "daylight" mode, PC98, etc)
	- various mouse colors/shapes/animations (with temporary shiny mode when the user has been writing a lot in a short time)
	- user colors with each user getting a random color
- Collaborative UI design mode to edit a DS4U's UI (with later on optional support for Naninovel as well), and export as prefab
- Cutscene planner
	- With export feature to a format that can later be read by Freecap
	- Scripted dialogue export (for DS4U)
	- Support for WYSIWYG editing of Cinemachine-related work, like camera IDs, etc

### End goal

A collaborative tool that supports:
- Dialogues
- Actors/Characters
- Key items
- References/Variables
- UI layouts
- GDDs
- Kanbans & to-do lists
- Timelines
- Map planning files
- Translations
- Moodboards
- Cutscene plans
- The tool should make it easy to export to Unity and give clear & concise instructions on how to handle generated files!

### Current Freewrite issues

- Add "del" shortcut to delete a shape in the location editor.
- Move "save" and "save as" to the project menu tab (left menu, after "New Project" and "Open Project")
- New projects should by default include two actors: Player and NPC.
- Clicking on the warnings at the bottom of the page should list the warnings.
- Inconsistencies: some of the menus (new project, new conversation, new location, new document, variables, collaborate, DS4U export) don't match the styling of the other menus (eg: no background blur), this is to be fixed.

## Freecap

Freecap is a FOSS performance capture & cutscene editing tool, aimed at indy teams looking for a free & scalable solution to collaborative performance.
Freecap is meant as a replacement for tools such as MoCap Fusion, Cascadeur, & add much more to it.
Freecap is set to support the following elements:
- Real-time multiuser motion capture with SteamVR & FBT options, with support for Vive 3.0 trackers first and maybe more down the line
- Various automatic locomotion animation for actors to choose from (leg IK, walk cycle, etc etc)
- VR animation tools, with object keyframing right within the editor
- Character models import in VRM, FBX, PMX, MMD formats (& more)
- Static models import in FBX, OBJ, AIWORLDED, SKP formats (& more)
- Realtime shapekey/blendshapes animation, with support for face tracking & more
- Layering of animations & baking on export into one (or multiple) layers
- Retargetting, with IK/FK support
- Camera animation with export to Cinemachine 3, Unreal Engine's camera systems, & Blender camera motion
- Comments within the scene, with basic lighting support as well
- Fast, with low-poly default models that can fit a wide variety of characters & scenes
- Direct export to Unity, & maybe Godot too down the line
- MCP support for quickly laying out scene reference & expand on from there
- Basic character rigging for any of the supported model formats (eg OBJ format will have rigid limbs)
- Physbones & export as VRM of the character models to bake those
- Physics automation to quickly generate accurate animations
- Automatic & manual MoCap data cleanup for polished animation
- Support for various export nesting
	- One folder per sequence, one file per character/object
	- One folder per character, one file per sequence
	- etc etc
- Freecap should remain a high-performance first tool, with multiuser editing & VR support being some of the main focus points
