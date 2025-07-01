/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable max-len */
import * as React from 'react';

import { cn } from '../utils/util';

const AITextarea = React.forwardRef<
HTMLTextAreaElement,
React.ComponentProps<'textarea'>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        'flex min-h-[45px] w-full border-box rounded-md border border-input bg-white px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-black dark:placeholder:text-[#888888]',
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
AITextarea.displayName = 'Textarea';

export { AITextarea };
