/*
 * Nikolas Huang, CMPM 120, Feb 10
 * 
 *  FRAME PROJECTION
 * 
 * 
 * 
 * 
 */

'use strict'

const config = {
    parent: 'phaser-game',
    type: Phaser.WEBGL,
    width: 1980,
    height: 1080,
    pixelArt: false,
    zoom: 1,
    physics: {
        default: 'arcade',
        arcade: {
            debug: true
        }
    },
    scene: [ Load, Play ]
}

const game = new Phaser.Game(config)