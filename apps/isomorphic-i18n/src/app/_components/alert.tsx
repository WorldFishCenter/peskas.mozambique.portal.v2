import { Alert as RAlert, Text } from "rizzui"

import cn from "@utils/class-names";

export default function Alert({
  color,
  message,
  className,
}: {
  color: 'danger' | 'success' | 'warning';
  message: string;
  className?: string;
}) {
  return (
    <RAlert 
      color={color}
      variant="flat" 
      className={cn(className)}
    >
      <Text>{message}</Text>
    </RAlert>  
  )
}