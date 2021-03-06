"use strict";

function _updateTitile( e, t ) {
	t || (t = Editor.assetdb.uuidToUrl( Editor.currentSceneUuid )), t || (t = "Untitled");
	var s = e ? "*" : "";
	Editor.Window.main.nativeWin.setTitle( Editor.T("SHARED.product_name") + " - " + Editor.projectInfo.name + " - " + t + s );
}

function _showSaveDialog() {
	for ( var e = !0; e; ) {
		e = !1;
		var t = Editor.assetdb._fspath("db://assets/"),
			s = Dialog.showSaveDialog( Editor.Window.main.nativeWin, {
				title: "Save Scene",
				defaultPath: t,
				filters: [ {
					name: "Scenes",
					extensions: [ "fire" ]
				} ]
			});
		if ( s ) {
			if ( Path.contains( t, s ) ) {
				return "db://assets/" + Path.relative( t, s );
			}
			Editor.Dialog.messageBox( Editor.Window.main.nativeWin, {
				type: "warning",
				buttons: [ "OK" ],
				title: Editor.T("MESSAGE.warning"),
				message: Editor.T("MESSAGE.scene.save_inside_assets_message"),
				detail: Editor.T("MESSAGE.scene.save_inside_assets_detail"),
				noLink: !0
			}), e = !0, t = s = void 0;
		}
	}
}

function _setCurrentScene( e ) {
	Editor.currentSceneUuid = e, Editor._projectLocalProfile[ "last-edit" ] = Editor.currentSceneUuid, Editor._projectLocalProfile.save();
}

var Fs = require("fire-fs"),
	Path = require("fire-path"),
	Electron = require("electron"),
	Dialog = Electron.dialog;

module.exports = {
	load: function() {},
	unload: function() {},
	messages: {
		open: function() {
			Editor.Panel.open("flow");
		},
		"open-by-uuid": function( e, t ) {
			Editor.Panel.open("flow", {
				uuid: t
			});
		},
		ready: function() {
			_updateTitile( !1 );
		},
		"save-scene": function( e, t ) {
			var s = Editor.assetdb.uuidToUrl( Editor.currentSceneUuid );
			if ( s || (s = _showSaveDialog()) ) {
				var i = Editor.assetdb._fspath( s );
				Fs.existsSync( i ) ? Editor.assetdb.saveExists( s, t, function( e, t ) {
					if ( e ) {
						return void Editor.assetdb.error("Failed to save scene %s", s, e.stack );
					}
					var i = t.meta;
					Editor.Ipc.sendToAll("asset-db:asset-changed", {
						type: i.assetType(),
						uuid: i.uuid
					}), Editor.Ipc.sendToAll("flow:saved");
				}) : Editor.assetdb.create( s, t, function( e, t ) {
					return e ? void Editor.assetdb.error("Failed to create asset %s, messages: %s", s, e.stack ) : (_setCurrentScene( t[ 0 ].uuid ), Editor.Ipc.sendToAll("asset-db:assets-created", t ), void Editor.Ipc.sendToAll("flow:saved"));
				});
			}
		},
		"create-prefab": function( e, t, s ) {
			var i = Editor.assetdb._fspath( t );
			Fs.existsSync( i ) ? Editor.assetdb.saveExists( t, s, function( s, i ) {
				if ( s ) {
					return Editor.assetdb.error("Failed to save prefab %s, messages: %s", t, s.stack ), void e.reply( s );
				}
				var r = i.meta;
				e.reply( null, r.uuid ), Editor.Ipc.sendToAll("asset-db:asset-changed", {
					type: r.assetType(),
					uuid: r.uuid
				});
			}) : Editor.assetdb.create( t, s, function( s, i ) {
				return s ? (Editor.assetdb.error("Failed to create prefab %s, messages: %s", t, s.stack ), void e.reply( s )) : (e.reply( null, i[ 0 ].uuid ), void Editor.Ipc.sendToAll("asset-db:assets-created", i ));
			});
		},
		"apply-prefab": function( e, t, s ) {
			var i = Editor.assetdb.uuidToUrl( t );
			Editor.assetdb.saveExists( i, s, function( e, t ) {
				if ( e ) {
					return void Editor.assetdb.error("Failed to apply prefab %s, messages: %s", i, e.stack );
				}
				var s = t.meta;
				Editor.Ipc.sendToAll("asset-db:asset-changed", {
					type: s.assetType(),
					uuid: s.uuid
				});
			});
		},
		"query-asset-info-by-uuid": function( e, t ) {
			var s = Editor.assetdb.uuidToFspath( t );
			if ( !s ) {
				return e.reply();
			}
			var i = Editor.require("app://asset-db/lib/meta"),
				r = i.get( Editor.assetdb, t );
			r && !r.useRawfile() && (s = Editor.assetdb._uuidToImportPathNoExt( t ), s += ".json");
			var a = s.replace( /\\/g, "/");
			e.reply( null, {
				url: a,
				type: r.assetType()
			});
		},
		"update-title": function( e, t, s ) {
			_updateTitile( t, s );
		},
		"export-plist": function( e, t, s ) {
			var i = Editor.assetdb._url( t );
			Fs.existsSync( t ) ? Editor.assetdb.saveExists( i, s, function( t, s ) {
				if ( t ) {
					return Editor.assetdb.error("Failed to save plist %s, messages: %s", i, t.stack ), void e.reply( t );
				}
				var r = s.meta;
				e.reply( null, r.uuid ), Editor.Ipc.sendToAll("asset-db:asset-changed", {
					type: r.assetType(),
					uuid: r.uuid
				});
			}) : Editor.assetdb.create( i, s, function( t, s ) {
				return t ? (Editor.assetdb.error("Failed to create plist %s, messages: %s", i, t.stack ), void e.reply( t )) : (e.reply( null, s[ 0 ].uuid ), void Editor.Ipc.sendToAll("asset-db:assets-created", s ));
			});
		},
		"set-current-scene": function( e, t ) {
			_setCurrentScene( t ), e.reply();
		}
	}
};
