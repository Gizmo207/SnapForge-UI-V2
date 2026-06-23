import { describe, it, expect } from 'vitest';
import { classify } from './classify';

describe('classify', () => {
  it('files a component declared as a Card under cards, even when it wraps a button', () => {
    const src = `
      import './ProfileCard.css';
      const ProfileCardComponent = ({ name }) => (
        <div className="pc-card">
          <img src="/path/to/avatar.jpg" alt={name} />
          <button className="pc-contact">Contact</button>
        </div>
      );
      export default ProfileCardComponent;
    `;
    const r = classify(src);
    expect(r.subcategory).toBe('cards');
    expect(r.category).toBe('components');
  });

  it('still classifies a plain button component as buttons', () => {
    const src = `const FancyButton = () => <button className="btn">Click</button>;`;
    expect(classify(src).subcategory).toBe('buttons');
  });

  it('files the new sections: text effects, carousels, avatars', () => {
    expect(classify('export default function GradientText() { return <span>hi</span>; }').subcategory).toBe('text');
    expect(classify('const TypewriterText = () => <p>typing...</p>;').subcategory).toBe('text');
    expect(classify('export default function Carousel() { return <div className="swiper" />; }').subcategory).toBe('carousels');
    expect(classify('<div className="avatar"><img src="x"/></div>').subcategory).toBe('avatars');
  });

  it('does not mistake a TextField/Input for a text effect', () => {
    expect(classify('export default function TextField() { return <input type="text" />; }').subcategory).toBe('inputs');
  });

  it('files a WebGL scene under backgrounds even when it wraps a button', () => {
    const src = `
      const InfiniteMenu = () => {
        const ref = useRef();
        useEffect(() => { const gl = ref.current.getContext('webgl2', { antialias: true }); }, []);
        return (<div><canvas ref={ref} /><button className="action">→</button></div>);
      };
    `;
    expect(classify(src).subcategory).toBe('backgrounds');
  });
});
