/*
 * Nikolas Huang, CMPM 120, Feb 10
 * 
 *  Temporal Frame
 * 
 * Creative Tilt:
 * I think my creative tilt justification is the Frame Projection
 * that was inspire from a Shonen anime 'Jujutsu Kaisen'.
 * It uses a character's technique called 'Projection Sorcery' which
 * allows the user to split up their movements into 24 frames in a second.
 * For learning and accessibility purposes I have toned it down to 6 frames,
 * and giving the player more leeway by giving them 5 >>> 2.5 seconds to complete
 * all QTE (Quick Time Event) buttons (A and D). By doing this, they project their 
 * runner into the a "somewhat" safe spot and continue running. If by any means
 * they fail to complete the projection, they freeze in frame for 1 second.
 * (nothing bad happens, they just freeze, this can also be used as a fail safe
 * if needed). With my own twist, (also cause I've spent too many hours trying to fix,
 * I'm deciding to embrace this as a cool gimmick) the projection is also allowed to
 * move through walls so players can move into more favorable spots etc.
 * 
 * All Assets Used------------------------------------------------------------------
 *  FreezeFrame.mp3 =>https://create.roblox.com/store/asset/9116384757/Magic-Burst-1-SFX
 *  SongRunning.mp3 => A friend and I worked on it, with him slightly guiding me through it
 *  Grassland_Terrain_Tiles.png => https://opengameart.org/content/multi-platformer-tileset-grassland-old-version
 *  devTiles.png => made by me
 *  All Tile Maps and Chunks => Used the tileset, but all actual maps made by me
 *  devNaoya.png => this is a test character, made by me
 *  NaoyaSprite.png => made by me with more effort compared to devNaoya.png
 * 
 * 
 * Hours worked prediction: 36
 * 
 * 
 */

'use strict'

const config = {
    type: Phaser.AUTO,
    render: {
        pixelArt: true,
        roundPixels: true
    },
    width: 1280,
    height: 720,
    backgroundColor: '#87CEEB',
    zoom: 1,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            debug: true
        }
    },
    scene: [ Load, Menu, Play ]
}

const game = new Phaser.Game(config)