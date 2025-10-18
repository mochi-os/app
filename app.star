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
def action_app_create(a):
	name = a.input("name")
	if not mochi.valid(name, "name"):
		return a.error(400, "Invalid app name")
	
	id = mochi.entity.create("app", name, "public")
	mochi.db.query("replace into apps ( id, name ) values ( ?, ? )", id, name)

	a.redirect("/app/" + id)

# List apps
def action_apps_list(a):
	a.template("list", mochi.db.query("select * from apps order by name"))

# Enter details of new app
def action_app_new(a):
	a.template("new")

# View an app
def action_app_view(a):
	app = mochi.db.row("select * from apps where id=?", a.input("app"))
	if not app:
		return a.error(404, "App not found")
	
	app["fingerprint"] = mochi.entity.fingerprint(app["id"], True)
	
	a.template("view", {"app": app, "tracks": mochi.db.query("select * from tracks where app=? order by track", app["id"]), "versions": mochi.db.query("select * from versions where app=? order by version", app["id"]), "administrator": a.user()["role"] == "administrator"})

# Create a version
def action_version_create(a):
	app = mochi.db.row("select * from apps where id=?", a.input("app"))
	if not app:
		return a.error(404, "App not found")

	file = a.input("file")
	if not mochi.valid(file, "filename"):
		return a.error(400, "File name invalid")

	a.upload("file", file)

	version = mochi.app.install(app["id"], file, a.input("install") != "yes")

	mochi.db.query("replace into versions ( app, version, file ) values ( ?, ?, ? )", app["id"], version, file)
	mochi.db.query("replace into tracks ( app, track, version ) values ( ?, 'production', ? )", app["id"], version)

	a.template("version/create", {"app": app, "version": version})

# Receive a request for information about an app
def event_information(e):
	a = mochi.db.row("select * from apps where id=?", e.to)
	if not a:
		return e.write({"status": "404", "message": "App not found"})
	
	e.write({"status": "200"})
	e.write(a)
	e.write(mochi.db.query("select track, version from tracks where app=?", e.to))

# Recieve a request to download an app
def event_get(e):
	v = mochi.db.row("select * from versions where app=? and version=?", e.to, e.content("version"))
	if not v:
		e.write({"status": "404", "message": "App or version not found"})
		return
	
	e.write({"status": "200"})
	e.write_from_file(v["file"])

# Received a request to get version for requested track
def event_version(e):
	t = mochi.db.row("select version from tracks where app=? and track=?", e.to, e.content("track", "production"))
	if not t:
		return e.write({"status": "404", "message": "App or track not found"})

	e.write({"status": "200"})
	e.write({"version": t["version"]})
