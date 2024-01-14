
import { View, ButtonView } from 'ckeditor5/src/ui';

/**
 * The view displaying detailed information about a special character glyph, e.g. upon
 * hovering it with a mouse.
 *
 */
export default class EmotionPaginationView extends View {
    constructor( locale ) {
        super( locale );

        const bind = this.bindTemplate;

        this.set('page', 1)
        this.set('totalPage', 1)

        this.pages = this.createCollection();
        this.setTemplate( {
            tag: 'div',
            children: [
                {
                    tag: 'div',
                    attributes: {
                        class: [
                            'ck',
                            'ck-emotion-pagination__items'
                        ]
                    },
                    children: this.pages
                }
            ]
        } );
    }

    updatePage(page, maxPage) {
        this.pages.clear()

        for (let i = 1; i <= maxPage; i++) {
            const btn = new ButtonView( this.locale );
            btn.set({
                label: i,
                withText: true,
                class: 'ck-emotion-pagination__item ' + (page === i ? 'ck-emotion-pagination__current' : '')
            });

            btn.on( 'execute', () => {
                this.fire( 'execute', { page: i } );
            } );

            this.pages.add(btn);
        }

    }
}
