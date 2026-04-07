interface Props {
  imageUrls: string[];
  tier: 'Esencial' | 'Equilibrado' | 'Experiencia Completa';
}

export function ProductCollage({ imageUrls, tier }: Props) {
  const imgs = imageUrls.filter(Boolean).slice(0, 4);

  const TIER_COLORS = {
    'Esencial': '#446084',
    'Equilibrado': '#014D6F',
    'Experiencia Completa': '#1a3a5c',
  };

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '180px',
      borderRadius: '12px 12px 0 0',
      overflow: 'hidden',
      marginBottom: '0',
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: imgs.length >= 3 ? '60% 40%' : '1fr',
        gridTemplateRows: imgs.length >= 3 ? '1fr 1fr' : '1fr',
        width: '100%',
        height: '100%',
        gap: '2px',
      }}>
        {imgs.length === 0 && (
          <div style={{ background: '#E8F2F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#014D6F', fontSize: 40 }}>🍱</span>
          </div>
        )}
        {imgs.length === 1 && (
          <img src={imgs[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
        {imgs.length === 2 && imgs.map((url, i) => (
          <img key={i} src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ))}
        {imgs.length >= 3 && (
          <>
            <img src={imgs[0]} alt="" style={{ gridRow: '1 / 3', width: '100%', height: '100%', objectFit: 'cover' }} />
            <img src={imgs[1]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <img src={imgs[2]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </>
        )}
      </div>

      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to bottom, transparent 40%, rgba(1,77,111,0.7) 100%)',
      }} />

      <div style={{
        position: 'absolute', bottom: 12, left: 12,
        background: TIER_COLORS[tier],
        color: 'white',
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '11px',
        fontWeight: '700',
        fontFamily: "'Montserrat', sans-serif",
        letterSpacing: '0.1em',
        textTransform: 'uppercase' as const,
      }}>
        {tier === 'Equilibrado' && '⭐ '}
        {tier}
      </div>
    </div>
  );
}
