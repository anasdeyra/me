import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function Counter({ label }: { label: string }) {
  const [count, setCount] = useState(0);
  return (
    <Button onClick={() => setCount((c) => c + 1)}>
      {label.replace('{count}', String(count))}
    </Button>
  );
}
