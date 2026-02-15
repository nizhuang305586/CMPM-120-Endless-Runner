/*
 * Nikolas Huang, CMPM 120, Feb 10
 * 
 *  Temporal Frame
 * 
 * Hours worked prediction: 13
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
    scene: [ Load, Play ]
}

const game = new Phaser.Game(config)