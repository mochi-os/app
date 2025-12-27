# Mochi App publisher app
# Copyright Alistair Cunningham 2025

# Create database
def database_create():
	mochi.db.execute("create table apps ( id text not null primary key, name text not null, privacy text not null default 'public' )")
	mochi.db.execute("create table versions ( app references apps( id ), version text not null, file text not null, primary key ( app, version ) )")
	mochi.db.execute("create index versions_file on versions( file )")
	mochi.db.execute("create table tracks ( app references apps( id ), track text not null, version text not null, primary key ( app, track ) )")

# Return JSON error response
def json_error(message, code=400):
	return {"status": code, "error": message, "data": {}}

# List apps
def action_list(a):
	apps = mochi.db.rows("select a.*, t.version from apps a left join tracks t on a.id = t.app and t.track = 'production' order by a.name")
	return {"data": {"apps": apps}}

# View an app (supports both authenticated and anonymous access)
def action_view(a):
	id = a.input("app")
	if not id or len(id) > 51:
		return json_error("Invalid app ID")
	app = mochi.db.row("select * from apps where id=?", id)
	if not app:
		return json_error("App not found", 404)

	app["fingerprint"] = mochi.entity.fingerprint(app["id"], True)
	tracks = mochi.db.rows("select * from tracks where app=? order by track", app["id"])

	# Get publisher identity for share string
	publisher = a.user.identity.id if a.user and a.user.identity else ""

	# Check if user is authenticated and is an administrator
	is_admin = a.user and a.user.role == "administrator"

	# For anonymous users or non-admins, return public share info only
	if not is_admin:
		return {"data": {"app": app, "tracks": tracks, "versions": [], "administrator": False, "share": True, "publisher": publisher}}

	# For administrators, return full management info
	versions = mochi.db.rows("select * from versions where app=? order by version", app["id"])
	return {"data": {"app": app, "tracks": tracks, "versions": versions, "administrator": True, "share": False, "publisher": publisher}}

# Create new app
def action_create(a):
	name = a.input("name")
	if not mochi.valid(name, "name"):
		return json_error("Invalid app name")

	privacy = a.input("privacy")
	if not mochi.valid(privacy, "privacy"):
		return json_error("Invalid privacy")

	id = mochi.entity.create("app", name, privacy)
	if not id:
		return json_error("Failed to create app entity", 500)

	mochi.db.execute("replace into apps ( id, name, privacy ) values ( ?, ?, ? )", id, name, privacy)

	return {"data": {"id": id, "name": name}}

# Create a version
def action_version_create(a):
	id = a.input("app")
	if not id or len(id) > 51:
		return json_error("Invalid app ID")
	app = mochi.db.row("select * from apps where id=?", id)
	if not app:
		return json_error("App not found", 404)

	file = a.input("file")
	if not mochi.valid(file, "filename"):
		return json_error("File name invalid")

	a.upload("file", file)

	# Validate paths match existing version (unless force=true)
	force = a.input("force") == "yes"
	if not force:
		new_info = mochi.app.file.get(file)
		if not new_info:
			mochi.file.delete(file)
			return json_error("Failed to read app info from archive")

		# Get the latest existing version
		existing = mochi.db.row("select file from versions where app=? order by version desc limit 1", app["id"])
		if existing and existing["file"] and mochi.file.exists(existing["file"]):
			old_info = mochi.app.file.get(existing["file"])
			if old_info and old_info.get("paths"):
				new_paths = new_info.get("paths") or []
				old_paths = old_info.get("paths") or []
				if new_paths != old_paths:
					mochi.file.delete(file)
					return json_error("Paths mismatch: expected " + str(old_paths) + ", got " + str(new_paths) + ". Use force=yes to override.")

	version = mochi.app.file.install(app["id"], file, a.input("install") != "yes")
	if not version:
		mochi.file.delete(file)
		return json_error("Failed to install app version", 500)

	# Use insert or ignore to prevent duplicate version entries from concurrent requests
	mochi.db.execute("insert or ignore into versions ( app, version, file ) values ( ?, ?, ? )", app["id"], version, file)
	# Track update: last concurrent request wins (acceptable for admin operations)
	mochi.db.execute("replace into tracks ( app, track, version ) values ( ?, 'production', ? )", app["id"], version)

	return {"data": {"version": version, "app": app}}

# Receive a request for information about an app
def event_information(e):
	a = mochi.db.row("select * from apps where id=? and privacy='public'", e.header("to"))
	if not a:
		return e.write({"status": "404", "message": "App not found or not public"})

	e.write({"status": "200"})
	e.write(a)
	e.write(mochi.db.rows("select track, version from tracks where app=?", a["id"]))

# Receive a request to download an app
def event_get(e):
	a = mochi.db.row("select * from apps where id=? and privacy='public'", e.header("to"))
	if not a:
		return e.write({"status": "404", "message": "App not found or not public"})

	version = e.content("version")
	if not version or len(version) > 50:
		return e.write({"status": "400", "message": "Invalid version"})

	v = mochi.db.row("select * from versions where app=? and version=?", a["id"], version)
	if not v:
		return e.write({"status": "404", "message": "App version not found"})

	if not mochi.file.exists(v["file"]):
		return e.write({"status": "404", "message": "App version file not found"})

	e.write({"status": "200"})
	e.write_from_file(v["file"])

# Receive a request to get version for requested track
def event_version(e):
	a = mochi.db.row("select * from apps where id=? and privacy='public'", e.header("to"))
	if not a:
		return e.write({"status": "404", "message": "App not found or not public"})

	track = e.content("track", "production")
	if len(track) > 50:
		return e.write({"status": "400", "message": "Invalid track"})

	t = mochi.db.row("select version from tracks where app=? and track=?", a["id"], track)
	if not t:
		return e.write({"status": "404", "message": "App track not found"})

	e.write({"status": "200"})
	e.write({"version": t["version"]})
