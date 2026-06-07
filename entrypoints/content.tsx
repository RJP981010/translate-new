import ReactDOM from 'react-dom/client';
import { SelectionTranslator } from '../components/SelectionTranslator';
import '../assets/content.css';

export default defineContentScript({
  matches: ['<all_urls>'],
  allFrames: false,
  cssInjectionMode: 'ui',

  async main(ctx) {
    const ui = await createShadowRootUi(ctx, {
      name: 'translator-ui',
      position: 'overlay',
      anchor: 'body',
      onMount: (container) => {
        const root = document.createElement('div');
        container.append(root);
        const reactRoot = ReactDOM.createRoot(root);
        reactRoot.render(<SelectionTranslator />);
        return reactRoot;
      },
      onRemove: (root) => {
        root?.unmount();
      },
    });

    ui.mount();
  },
});
