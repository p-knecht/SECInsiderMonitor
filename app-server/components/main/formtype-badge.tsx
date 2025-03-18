import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';

/**
 * Definitions for different form types. Includes a description, background color, and font color for the badges of each form type.
 */
const formTypeDefinitions: Record<
  string,
  { description: string; bgColor: string; fontColor: string }
> = {
  '3': {
    description: 'Initial Statement of Beneficial Ownership',
    bgColor: 'bg-yellow-200',
    fontColor: 'text-black',
  },
  '4': {
    description: 'Changes in Beneficial Ownership',
    bgColor: 'bg-green-200',
    fontColor: 'text-black',
  },
  '5': {
    description: 'Annual Statement of Beneficial Ownership',
    bgColor: 'bg-blue-200',
    fontColor: 'text-black',
  },
  default: { description: 'Unknown Form Type', bgColor: 'bg-gray-200', fontColor: 'text-black' },
};

/**
 * Renders a badge component for a given form type.
 *
 * @param {string} formtype - The form type to render the badge for.
 * @param {string} tooltipLocation - The location of the tooltip. Defaults to 'top'.
 * @returns {React.ReactNode} - The rendered badge component.
 */
export const FormtypeBadge = ({
  formtype,
  tooltipLocation,
}: {
  formtype: string;
  tooltipLocation?: 'left' | 'right' | 'top' | 'bottom';
}): React.ReactNode => {
  const formTypeDefinition = formTypeDefinitions[formtype] ?? formTypeDefinitions.default;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge className={`${formTypeDefinition.bgColor} ${formTypeDefinition.fontColor}`}>
          Form {formtype}{' '}
        </Badge>
      </TooltipTrigger>
      <TooltipContent side={tooltipLocation || 'top'}>
        {formTypeDefinition.description}
      </TooltipContent>
    </Tooltip>
  );
};
