import Link from 'next/link';
import { getDocChannels } from '@/lib/doc-channels';
import { homeTags, siteDescription } from '@/lib/site';

export default function HomePage() {
  const docChannels = getDocChannels();

  return (
    <div className="dz-home">
      <section className="dz-hero">
        <div className="dz-hero__avatar" aria-hidden="true">
          🌶
        </div>
        <h1 className="dz-hero__title">dz-notes</h1>
        <p className="dz-hero__description">
          {siteDescription} {'持续记录与更新。'}
        </p>

        <div className="dz-tags" aria-label="Topics">
          {homeTags.map((tag) => (
            <span key={tag} className="dz-tag">
              {tag}
            </span>
          ))}
        </div>
      </section>

      <section className="dz-grid" aria-label="Primary channels">
        {docChannels.map((channel) => (
          <Link key={channel.slug} href={channel.href} className="dz-card">
            <span className="dz-card__bar" style={{ backgroundColor: channel.color }} />
            <h2 className="dz-card__title">{channel.title}</h2>
            <p className="dz-card__description">{channel.description}</p>
            <p className="dz-card__meta">{channel.meta}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
