import { RPM } from "../path.js";

const pluginName = "Skip title";

const infoVar = RPM.Manager.Plugins.getParameter(pluginName, "Text info variable ID");

var currentGame = null;

RPM.Scene.TitleScreen.prototype.load = async function ()
{
	RPM.Core.Game.current = null;
	RPM.Manager.Videos.stop();
	RPM.Manager.Songs.stopAll();
	RPM.Manager.GL.screenTone.set(0, 0, 0, 1);
	RPM.Manager.Stack.displayedPictures = [];
	this.pictureBackground = await RPM.Core.Picture2D.createWithID(RPM.Datas.TitlescreenGameover.titleBackgroundImageID, RPM.Common.Enum.PictureKind.TitleScreen, { cover: true });
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
}

RPM.Manager.Plugins.registerCommand(pluginName, "Save slot", (slot) =>
{
	RPM.Core.Game.current.save(slot);
});

RPM.Manager.Plugins.registerCommand(pluginName, "Load slot", async (slot) =>
{
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
});

RPM.Manager.Plugins.registerCommand(pluginName, "Get slot info", async (slot, info, time) =>
{
	const p = RPM.Core.ReactionInterpreter.currentObject;
	const game = new RPM.Core.Game(slot);
	p.properties[info] = null;
	try
	{
		await game.load();
		var s = game.playTime.getSeconds();
		const m = Math.floor(s / 60).toString();
		const h = Math.floor(s / 3600).toString();
		s = (s % 60).toString();
		p.properties[info] = game.variables[infoVar];
		p.properties[time] = (h.length === 1 ? "0" : "") + h + ":" + (m.length === 1 ? "0" : "") + m + ":" + (s.length === 1 ? "0" : "") + s;
	}
	catch (error)
	{
		p.properties[info] = "";
		p.properties[time] = "";
		console.log(error);
	}
});

RPM.Manager.Plugins.registerCommand(pluginName, "Open load menu", () =>
{
	currentGame = RPM.Core.Game.current;
	RPM.Manager.Stack.push(new RPM.Scene.Base());
	RPM.Manager.Stack.push(new RPM.Scene.LoadGame());
});

RPM.Manager.Plugins.registerCommand(pluginName, "Quit game", () =>
{
	RPM.System.TitleCommand.exit();
});
