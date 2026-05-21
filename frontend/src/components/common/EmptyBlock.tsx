interface Props {
  icon?: string;
  message: string;
}

export function EmptyBlock({ icon = '📊', message }: Props) {
  return (
    <div style={{
      background: '#FAFAF8', border: '1px solid #E8E8E4',
      borderRadius: 10, padding: '20px 16px',
      display: 'flex', alignItems: 'center', gap: 10,
      color: '#6B6B6B', fontSize: 13,
    }}>
      <span style={{ fontSize: 20 }}>{icon}</span>
      <p style={{ margin: 0 }}>{message}</p>
    </div>
  );
}
