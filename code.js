import { RPM } from "../path.js";

const pluginName = "Skip title";

var currentGame = null;
var settingsName = "Enable Settings on Systems tab!";

class WaitSaveLoadAsync extends RPM.EventCommand.Base
{
	constructor()
	{
		super();
		this.asyncSaveLoadFinished = false;
	}

	update(currentState)
	{
		return this.asyncSaveLoadFinished;
	}
}

class WaitSaveLoadScene extends RPM.EventCommand.Base
{
	constructor()
	{
		super();
		this.prevScene = RPM.Manager.Stack.top;
		this.beginCheck = false;
	}

	update(currentState)
	{
		return this.beginCheck && this.prevScene === RPM.Manager.Stack.top;
	}
}

RPM.Scene.TitleScreen.prototype.load = async function ()
{
	const l = RPM.Datas.TitlescreenGameover.titleCommands;
	for (var i = 0; i < l.length; i++)
		if (l[i].kind === RPM.Common.Enum.TitleCommandKind.Settings)
			settingsName = l[i].name();
	this.title = settingsName;
	RPM.Core.Game.current = null;
	RPM.Manager.Videos.stop();
	RPM.Manager.Songs.stopAll();
	RPM.Manager.GL.screenTone.set(0, 0, 0, 1);
	RPM.Manager.Stack.displayedPictures = [];
	this.pictureBackground = await RPM.Core.Picture2D.loadImage();
	RPM.System.TitleCommand.startNewGame();
};

RPM.Scene.LoadGame.prototype.cancel = function (isKey, options = {})
{
	if (RPM.Scene.MenuBase.checkCancelMenu(isKey, options))
	{
		RPM.Core.Game.current = currentGame;
		RPM.Datas.Systems.soundCancel.playSound();
		RPM.Manager.Stack.pop();
		RPM.Manager.Stack.pop();
	}
};

function addSaveLoadWaitCommand(alt = false)
{
	const c = RPM.Core.ReactionInterpreter.currentReaction.currentCommand;
	if (!c.hasSaveLoadWaitCommand)
	{
		c.hasSaveLoadWaitCommand = true;
		const n = c.next;
		if (!alt)
			c.next = new RPM.Core.Node(c.parent, new WaitSaveLoadAsync());
		else
			c.next = new RPM.Core.Node(c.parent, new WaitSaveLoadScene());
		c.next.next = n;
	}
	else
	{
		if (!alt)
			c.next.data.asyncSaveLoadFinished = false;
		else
		{
			c.beginCheck = false;
			c.next.prevScene = RPM.Manager.Stack.top;
		}
	}
	return c.next;
}

RPM.Manager.Plugins.registerCommand(pluginName, "Save slot", (slot) =>
{
	const waitCommand = addSaveLoadWaitCommand();
	RPM.Core.Game.current.save(slot);
	waitCommand.data.asyncSaveLoadFinished = true;
});

RPM.Manager.Plugins.registerCommand(pluginName, "Load slot", async (slot) =>
{
	const waitCommand = addSaveLoadWaitCommand();
	if (await RPM.Common.IO.fileExists(RPM.Common.Paths.SAVES + "/" + slot + ".json"))
	{
		RPM.Datas.Systems.soundConfirmation.playSound();
		RPM.Manager.Stack.replace(new RPM.Scene.Base());
		const game = new RPM.Core.Game(slot);
		await game.load();
		RPM.Core.Game.current = game;
		RPM.Core.Game.current.loadPositions();
		RPM.Core.Game.current.hero.initializeProperties();
		RPM.Manager.Stack.replace(new RPM.Scene.Map(RPM.Core.Game.current.currentMapID));
	}
	else
		RPM.Datas.Systems.soundImpossible.playSound();
	waitCommand.data.asyncSaveLoadFinished = true;
});

RPM.Manager.Plugins.registerCommand(pluginName, "Delete slot", async (slot) =>
{
	const waitCommand = addSaveLoadWaitCommand();
	const fs = require("fs").promises;
	try
	{
		await fs.unlink(RPM.Common.Paths.SAVES + "/" + slot + ".json");
	}
	catch (e)
	{
		console.error(e);
	}
	waitCommand.data.asyncSaveLoadFinished = true;
});

RPM.Manager.Plugins.registerCommand(pluginName, "Slot exists?", async (slot, variable) =>
{
	const waitCommand = addSaveLoadWaitCommand();
	RPM.Core.Game.current.variables[variable] = -1;
	RPM.Core.Game.current.variables[variable] = await RPM.Common.IO.fileExists(RPM.Common.Paths.SAVES + "/" + slot + ".json");
	waitCommand.data.asyncSaveLoadFinished = true;
});

RPM.Manager.Plugins.registerCommand(pluginName, "Get slot variable", async (slot, variable, result) =>
{
	const waitCommand = addSaveLoadWaitCommand();
	const v = RPM.Core.Game.current.variables;
	const game = new RPM.Core.Game(slot);
	try
	{
		await game.load();
		v[result] = game.variables[variable];
	}
	catch (e)
	{
		v[result] = e;
	}
	waitCommand.data.asyncSaveLoadFinished = true;
});

RPM.Manager.Plugins.registerCommand(pluginName, "Open load menu", () =>
{
	const waitCommand = addSaveLoadWaitCommand(true);
	currentGame = RPM.Core.Game.current;
	RPM.Manager.Stack.push(new RPM.Scene.Base());
	RPM.Manager.Stack.push(new RPM.Scene.LoadGame());
	waitCommand.data.beginCheck = true;
});

RPM.Manager.Plugins.registerCommand(pluginName, "Open settings menu", () =>
{
	const waitCommand = addSaveLoadWaitCommand(true);
	RPM.Manager.Stack.push(new RPM.Scene.TitleSettings(settingsName));
	waitCommand.data.beginCheck = true;
});

RPM.Manager.Plugins.registerCommand(pluginName, "Quit game", () =>
{
	RPM.System.TitleCommand.exit();
});
