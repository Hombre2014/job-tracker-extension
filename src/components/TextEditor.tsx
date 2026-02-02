import { debounce } from 'lodash';
import { useState, useCallback, useEffect } from 'react';
import {
  Editor,
  BtnBold,
  Toolbar,
  BtnUndo,
  BtnRedo,
  BtnLink,
  BtnStyles,
  BtnItalic,
  Separator,
  HtmlButton,
  BtnUnderline,
  createButton,
  BtnBulletList,
  EditorProvider,
  BtnNumberedList,
  BtnStrikeThrough,
  type ContentEditableEvent,
} from 'react-simple-wysiwyg';

interface TextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

// Create alignment buttons (outside component to avoid recreation on each render)
const BtnAlignLeft = createButton('Align left', '⟨', 'justifyLeft');
const BtnAlignRight = createButton('Align right', '⟩', 'justifyRight');
const BtnAlignCenter = createButton('Align center', '≡', 'justifyCenter');

const TextEditor = ({ value, onChange, placeholder }: TextEditorProps) => {
  const [html, setHtml] = useState(value || '');
  const [showPlaceholder, setShowPlaceholder] = useState(!value);

  // Debounced onChange to avoid too many updates
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedOnChange = useCallback(
    debounce((newValue: string) => {
      onChange(newValue);
    }, 300),
    [onChange],
  );

  // Cleanup debounced function on unmount
  useEffect(() => {
    return () => {
      debouncedOnChange.cancel();
    };
  }, [debouncedOnChange]);

  // Update local state when external value changes
  useEffect(() => {
    if (value !== html) {
      setHtml(value || '');
      setShowPlaceholder(!value);
    }
  }, [value]); // Only depend on value, not html to avoid infinite loop

  const handleChange = (e: ContentEditableEvent) => {
    const newValue = e.target.value;
    setHtml(newValue);
    setShowPlaceholder(!newValue || newValue.trim() === '');
    debouncedOnChange(newValue);
  };

  const handleFocus = () => {
    setShowPlaceholder(false);
  };

  const handleBlur = () => {
    if (!html || html.trim() === '') {
      setShowPlaceholder(true);
    }
  };

  return (
    <div className="w-full">
      <EditorProvider>
        <div>
          <Editor
            value={showPlaceholder && !html ? placeholder : html}
            onBlur={handleBlur}
            onFocus={handleFocus}
            onChange={handleChange}
            style={{
              backgroundColor: '#fefce8', // yellow-50
              color: '#000000',
              minHeight: '150px',
            }}
            containerProps={{
              style: {
                overflow: 'auto',
                minHeight: '150px',
                maxHeight: '300px',
                border: '1px solid #e2e8f0',
                borderRadius: '0.75rem',
              },
            }}
          >
            <div className="sticky top-0 z-50 bg-white border-b border-slate-200">
              <Toolbar>
                <BtnUndo />
                <BtnRedo />
                <Separator />
                <BtnBold />
                <BtnItalic />
                <BtnUnderline />
                <BtnStrikeThrough />
                <Separator />
                <BtnAlignLeft />
                <BtnAlignCenter />
                <BtnAlignRight />
                <Separator />
                <BtnNumberedList />
                <BtnBulletList />
                <Separator />
                <BtnLink />
                <HtmlButton />
                <Separator />
                <BtnStyles />
              </Toolbar>
            </div>
          </Editor>
        </div>
      </EditorProvider>
    </div>
  );
};

export default TextEditor;
