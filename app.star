# Mochi App publisher app
# Copyright Alistair Cunningham 2025


# Create database
def database_create():
	mochi.db.query("create table apps ( id text not null primary key, name text not null )")

	mochi.db.query("create table versions ( app references app( id ), version text not null, primary key ( app, version ) )")

	mochi.db.query("create table tracks ( app references app( id ), track text not null, version text not null, primary key ( app, track ) )")
	return 1


# Create new app
def action_create(action, inputs):
	name = inputs.get("name")
	if not mochi.valid(name, "name"):
		mochi.action.error(400, "Invalid app name")
		return
	
	id = mochi.entity.create("app", name, "public")
	mochi.db.query("replace into apps ( id, name ) values ( ?, ? )", id, name)

	mochi.action.redirect("/app/" + id)


# List apps
def action_list(action, inputs):
	mochi.action.write("list", action["format"], mochi.db.query("select * from apps order by name"))


# Enter details of new app
def action_new(action, inputs):
	mochi.action.write("new", action["format"])


# View an app
def action_view(action, inputs):
	app = mochi.db.row("select * from apps where id=?", inputs.get("app"))
	if not app:
		mochi.action.error(404, "App not found")
		return
	
	mochi.action.write("view", action["format"], {"app": app})


# Recieve a request to download an app
def event_get(event, content):
	app = mochi.db.row("select * from apps where id=?", content.get("app"))
	if not app:
		return



# Received a request to upload a new version
def event_put(event, content):
	pass


# Received a request for available versions and tracks
def event_versions(event, content):
	app = mochi.db.row("select * from apps where id=?", content.get("app"))
	if not app:
		return
