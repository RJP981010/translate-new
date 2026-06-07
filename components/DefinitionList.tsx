import type { Definition } from '../types/lookup';

interface DefinitionListProps {
  definitions: Definition[];
}

export function DefinitionList({ definitions }: DefinitionListProps) {
  return (
    <div className="space-y-4">
      {definitions.map((def, i) => (
        <div key={`${def.pos}-${i}`} className="border-t border-gray-100 pt-3 first:border-0 first:pt-0">
          <div className="flex gap-2 text-sm leading-relaxed text-gray-900">
            <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
              {def.pos}
            </span>
            <span>{def.meanings.join('；')}</span>
          </div>
          {def.example && (
            <p className="mt-1.5 text-sm leading-relaxed text-gray-500">
              <span className="italic text-gray-600">{def.example.en}</span>
              {def.example.zh && (
                <>
                  <span className="mx-1 text-gray-300">/</span>
                  {def.example.zh}
                </>
              )}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
