# Mochi App publisher app
# Copyright Alistair Cunningham 2025


# Create database
def database_create():
	mochi.db.query("create table apps ( id text not null primary key, name text not null )")

	mochi.db.query("create table versions ( app references app( id ), version text not null, file text not null, primary key ( app, version ) )")
	mochi.db.query("create index versions_file on versions( file )")

	mochi.db.query("create table tracks ( app references app( id ), track text not null, version text not null, primary key ( app, track ) )")
	return 1


# Create new app
def action_app_create(action, inputs):
	name = inputs.get("name")
	if not mochi.valid(name, "name"):
		mochi.action.error(400, "Invalid app name")
		return
	
	id = mochi.entity.create("app", name, "public")
	mochi.db.query("replace into apps ( id, name ) values ( ?, ? )", id, name)

	mochi.action.redirect("/app/" + id)


# List apps
def action_apps_list(action, inputs):
	mochi.action.write("list", action["format"], mochi.db.query("select * from apps order by name"))


# Enter details of new app
def action_app_new(action, inputs):
	mochi.action.write("new", action["format"])


# View an app
def action_app_view(action, inputs):
	app = mochi.db.row("select * from apps where id=?", inputs.get("app"))
	if not app:
		mochi.action.error(404, "App not found")
		return
	
	app["fingerprint"] = mochi.entity.fingerprint(app["id"], True)
	
	mochi.action.write("view", action["format"], {"app": app, "tracks": mochi.db.query("select * from tracks where app=? order by track", app["id"]), "versions": mochi.db.query("select * from versions where app=? order by version", app["id"])})


# Create a track
#TODO
def action_track_create(action, inputs):
	app = mochi.db.row("select * from apps where id=?", inputs.get("app"))
	if not app:
		mochi.action.error(404, "App not found")
		return

	mochi.action.write("track/create", action["format"], {"app": app})


# New track
#TODO
def action_track_new(action, inputs):
	app = mochi.db.row("select * from apps where id=?", inputs.get("app"))
	if not app:
		mochi.action.error(404, "App not found")
		return

	mochi.action.write("track/new", action["format"], {"app": app})


# Create a version
def action_version_create(action, inputs):
	app = mochi.db.row("select * from apps where id=?", inputs.get("app"))
	if not app:
		mochi.action.error(404, "App not found")
		return

	file = mochi.action.file.name("file")
	if not mochi.valid(file, "filename"):
		mochi.action.error(400, "File name invalid")
		return

	mochi.action.file.write("file", file)

	version = mochi.app.install(app["id"], file, inputs.get("install") != "yes")

	mochi.db.query("replace into versions ( app, version, file ) values ( ?, ?, ? )", app["id"], version, file)
	if not mochi.db.exists("select track from tracks where app=? limit 1", app["id"]):
		mochi.db.query("replace into tracks ( app, track, version ) values ( ?, 'production', ? )", app["id"], version)

	mochi.action.write("version/create", action["format"], {"app": app, "version": version})


# Recieve a request to download an app
def event_get(event, content):
	v = mochi.db.row("select * from versions where app=? and version=?", event["to"], content.get("version"))
	if not v:
		mochi.event.response({"status": 404, "message": "App or version not found"})
		return
	
	mochi.event.response({"status": 200})
	mochi.event.file(v["file"])


# Received a request to get version for requested track
def event_version(event, content):
	t = mochi.db.row("select version from tracks where app=? and track=?", event["to"], content.get("track", "production"))
	if not t:
		mochi.event.response({"status": 404, "message": "App or track not found"})
		return

	mochi.event.response({"status": 200, "version": t["version"]})
