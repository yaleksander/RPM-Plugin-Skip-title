import { RPM } from "../path.js";

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
