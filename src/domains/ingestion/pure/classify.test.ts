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
