# Mochi App publisher app
# Copyright Alistair Cunningham 2025

# Create database
def database_create():
	mochi.db.query("create table apps ( id text not null primary key, name text not null, privacy text not null default 'public' )")
	mochi.db.query("create table versions ( app references apps( id ), version text not null, file text not null, primary key ( app, version ) )")
	mochi.db.query("create index versions_file on versions( file )")
	mochi.db.query("create table tracks ( app references apps( id ), track text not null, version text not null, primary key ( app, track ) )")

# List apps
def action_list(a):
	apps = mochi.db.query("select * from apps order by name")
	return {"data": {"apps": apps}}

# View an app
def action_view(a):
	id = a.input("id")
	if len(id) > 51:
		return {"status": 400, "error": "Invalid app ID", "data": {}}
	app = mochi.db.row("select * from apps where id=?", id)
	if not app:
		return {"status": 404, "error": "App not found", "data": {}}

	app["fingerprint"] = mochi.entity.fingerprint(app["id"], True)
	tracks = mochi.db.query("select * from tracks where app=? order by track", app["id"])
	versions = mochi.db.query("select * from versions where app=? order by version", app["id"])

	return {"data": {"app": app, "tracks": tracks, "versions": versions, "administrator": a.user.role == "administrator"}}

# Create new app
def action_create(a):
	name = a.input("name")
	if not mochi.valid(name, "name"):
		return {"status": 400, "error": "Invalid app name", "data": {}}

	privacy = a.input("privacy")
	if not mochi.valid(privacy, "privacy"):
		return {"status": 400, "error": "Invalid privacy", "data": {}}

	id = mochi.entity.create("app", name, privacy)
	mochi.db.query("replace into apps ( id, name, privacy ) values ( ?, ?, ? )", id, name, privacy)

	return {"data": {"id": id, "name": name}}

# Create a version
def action_version_create(a):
	id = a.input("app")
	if len(id) > 51:
		return {"status": 400, "error": "Invalid app ID", "data": {}}
	app = mochi.db.row("select * from apps where id=?", id)
	if not app:
		return {"status": 404, "error": "App not found", "data": {}}

	file = a.input("file")
	if not mochi.valid(file, "filename"):
		return {"status": 400, "error": "File name invalid", "data": {}}

	a.upload("file", file)

	version = mochi.app.install(app["id"], file, a.input("install") != "yes")

	mochi.db.query("replace into versions ( app, version, file ) values ( ?, ?, ? )", app["id"], version, file)
	mochi.db.query("replace into tracks ( app, track, version ) values ( ?, 'production', ? )", app["id"], version)

	return {"data": {"version": version, "app": app}}

# Receive a request for information about an app
def event_information(e):
	a = mochi.db.row("select * from apps where id=? and privacy='public'", e.header("to"))
	if not a:
		return e.write({"status": "404", "message": "App not found or not public"})

	e.write({"status": "200"})
	e.write(a)
	e.write(mochi.db.query("select track, version from tracks where app=?", a["id"]))

# Receive a request to download an app
def event_get(e):
	a = mochi.db.row("select * from apps where id=? and privacy='public'", e.header("to"))
	if not a:
		return e.write({"status": "404", "message": "App not found or not public"})

	v = mochi.db.row("select * from versions where app=? and version=?", a["id"], e.content("version"))
	if not v:
		return e.write({"status": "404", "message": "App version not found"})

	e.write({"status": "200"})
	e.write_from_file(v["file"])

# Receive a request to get version for requested track
def event_version(e):
	a = mochi.db.row("select * from apps where id=? and privacy='public'", e.header("to"))
	if not a:
		return e.write({"status": "404", "message": "App not found or not public"})

	t = mochi.db.row("select version from tracks where app=? and track=?", a["id"], e.content("track", "production"))
	if not t:
		return e.write({"status": "404", "message": "App track not found"})

	e.write({"status": "200"})
	e.write({"version": t["version"]})
