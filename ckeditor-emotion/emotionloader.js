import { Plugin } from 'ckeditor5/src/core';

export default class EmotionLoader extends Plugin {

    static get pluginName() {
        return 'EmotionLoader'
    }

    init() {
        const editor = this.editor;
        const t = editor.t;

        if (!window.emotionData) {
            return;
        }

        console.info("EmotionLoader", window.emotionData);

        for (let i = 0; i < window.emotionData.data.length; i++) {
            let res = [];
            let data = window.emotionData.data[i];

            for (let k in data.items) {
                res.push(
                    {id: k, url: window.emotionData.baseDir + data.items[k] }
                );
            }

            editor.plugins.get("Emotions").addItems(data.name, res);
        }
    }

}