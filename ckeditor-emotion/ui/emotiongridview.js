import { View, ButtonView } from 'ckeditor5/src/ui';

export default class EmotionGridView extends View {

    constructor( locale ) {
        super( locale );

        this.tiles = this.createCollection();

        this.setTemplate( {
            tag: 'div',
            children: [
                {
                    tag: 'div',
                    attributes: {
                        class: [
                            'ck',
                            'ck-emotion-grid__tiles'
                        ]
                    },
                    children: this.tiles
                }
            ],
            attributes: {
                class: [
                    'ck',
                    'ck-emotion-grid'
                ]
            }
        } );
    }

    createTile( url, id ) {
        const tile = new ButtonView( this.locale );

        /*
        tile.set( {
            label: id,
            withText: false,
            class: 'ck-emotion-grid__tile'
        } );*/

        tile.setTemplate({
            tag: "a",
            children: [
                {
                    tag: "img",
                    attributes: {
                        src: url
                    },
                }
            ],
            attributes: {
                title: '[s:' + id + ']',
                class: 'ck--emotion-grid__tile'
            },
            on: {
                click: tile.bindTemplate.to( 'execute' ),
            }
        })

        tile.on( 'execute', () => {
            this.fire( 'execute', { id: id, url: url } );
        } );

        return tile;
    }
}