import type { Control, FieldValues, Path } from "react-hook-form";
import * as React from "react";
import { Controller } from "react-hook-form";

import { cn } from ".";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export type ControlledInputProps<T extends FieldValues> = Omit<
  InputProps,
  "value"
> & {
  control: Control<T>;
  name: Path<T>;
};

const ControlledInput = <T extends FieldValues>(
  props: ControlledInputProps<T>,
) => {
  return (
    <Controller
      name={props.name}
      control={props.control}
      render={({ field }) => <Input {...field} {...props} className="mb-2" />}
    />
  );
};

export { Input, ControlledInput };
