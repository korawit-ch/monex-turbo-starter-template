'use client';

import { Button } from '@repo/ui/button';

export function ButtonDemo() {
  return (
    <section className="mt-8 pt-8 border-t border-surface">
      <h2 className="text-xl font-semibold mb-4">Button</h2>
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => alert('Clicked!')}>Click me</Button>
        <Button disabled>Disabled</Button>
        <Button className="bg-warning-500 hover:bg-warning-600">
          Custom Style
        </Button>
      </div>
    </section>
  );
}
