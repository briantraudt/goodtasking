import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { Bot, Loader2, Sparkles, Trash2, Wand2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { Idea } from '@/hooks/useProjects';

interface AddIdeaDialogProps {
  isOpen: boolean;
  initialIdea?: Idea | null;
  onClose: () => void;
  onSave: (idea: {
    id?: string;
    title?: string;
    rawIdea: string;
    distilledSummary?: string;
    gtmStrategy?: string;
    launchNeeds?: string[];
    launchChecklist?: string[];
    suggestedTechStack?: string[];
    status?: string;
  }) => Promise<Idea | null | void>;
  onDelete?: (id: string) => Promise<void> | void;
  onConvert?: (id: string) => Promise<void> | void;
}

const emptyState = {
  title: '',
  rawIdea: '',
  distilledSummary: '',
  gtmStrategy: '',
  launchNeeds: [] as string[],
  launchChecklist: [] as string[],
  suggestedTechStack: [] as string[],
};

type IdeaStage = 'ideation' | 'review' | 'project';

const AddIdeaDialog = ({
  isOpen,
  initialIdea,
  onClose,
  onSave,
  onDelete,
  onConvert,
}: AddIdeaDialogProps) => {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [title, setTitle] = useState('');
  const [rawIdea, setRawIdea] = useState('');
  const [distilledSummary, setDistilledSummary] = useState('');
  const [gtmStrategy, setGtmStrategy] = useState('');
  const [launchNeeds, setLaunchNeeds] = useState<string[]>([]);
  const [launchChecklist, setLaunchChecklist] = useState<string[]>([]);
  const [suggestedTechStack, setSuggestedTechStack] = useState<string[]>([]);
  const [stage, setStage] = useState<IdeaStage>('ideation');

  useEffect(() => {
    if (!isOpen) return;

    if (initialIdea) {
      setTitle(initialIdea.title || '');
      setRawIdea(initialIdea.rawIdea || '');
      setDistilledSummary(initialIdea.distilledSummary || '');
      setGtmStrategy(initialIdea.gtmStrategy || '');
      setLaunchNeeds(initialIdea.launchNeeds || []);
      setLaunchChecklist(initialIdea.launchChecklist || []);
      setSuggestedTechStack(initialIdea.suggestedTechStack || []);
      setStage(
        initialIdea.title ||
          initialIdea.suggestedTechStack?.length ||
          initialIdea.launchChecklist?.length ||
          initialIdea.gtmStrategy
          ? 'review'
          : 'ideation'
      );
      return;
    }

    setTitle(emptyState.title);
    setRawIdea(emptyState.rawIdea);
    setDistilledSummary(emptyState.distilledSummary);
    setGtmStrategy(emptyState.gtmStrategy);
    setLaunchNeeds(emptyState.launchNeeds);
    setLaunchChecklist(emptyState.launchChecklist);
    setSuggestedTechStack(emptyState.suggestedTechStack);
    setStage('ideation');
  }, [initialIdea, isOpen]);

  const canRunAI = rawIdea.trim().length > 20 && !!user;
  const hasAIOutput = useMemo(
    () =>
      Boolean(
        distilledSummary.trim() ||
          gtmStrategy.trim() ||
          launchNeeds.length ||
          launchChecklist.length ||
          suggestedTechStack.length
      ),
    [distilledSummary, gtmStrategy, launchNeeds, launchChecklist, suggestedTechStack]
  );

  const runAI = async () => {
    if (!canRunAI || !session?.access_token) return;

    setIsThinking(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-project-idea', {
        body: {
          rawIdea: rawIdea.trim(),
          currentTitle: title.trim() || undefined,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      setTitle(data.title || title);
      setDistilledSummary(data.distilledSummary || '');
      setGtmStrategy(data.gtmStrategy || '');
      setLaunchNeeds(Array.isArray(data.launchNeeds) ? data.launchNeeds : []);
      setLaunchChecklist(Array.isArray(data.launchChecklist) ? data.launchChecklist : []);
      setSuggestedTechStack(Array.isArray(data.suggestedTechStack) ? data.suggestedTechStack : []);
      setStage('review');

      toast({
        title: 'Idea distilled',
        description: 'AI pulled together the concept, launch plan, and starter checklist.',
      });
    } catch (error) {
      console.error('Error distilling idea:', error);
      toast({
        title: 'AI pass failed',
        description: 'We could not distill that idea right now. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsThinking(false);
    }
  };

  const saveIdea = async () => {
    if (!rawIdea.trim()) return;

    setIsSaving(true);
    try {
      await onSave({
        id: initialIdea?.id,
        title: title.trim(),
        rawIdea: rawIdea.trim(),
        distilledSummary: distilledSummary.trim(),
        gtmStrategy: gtmStrategy.trim(),
        launchNeeds: launchNeeds.filter(Boolean),
        launchChecklist: launchChecklist.filter(Boolean),
        suggestedTechStack: suggestedTechStack.filter(Boolean),
        status: initialIdea?.status || 'draft',
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const saveAndConvert = async () => {
    if (!rawIdea.trim()) return;

    setIsSaving(true);
    try {
      const saved = await onSave({
        id: initialIdea?.id,
        title: title.trim(),
        rawIdea: rawIdea.trim(),
        distilledSummary: distilledSummary.trim(),
        gtmStrategy: gtmStrategy.trim(),
        launchNeeds: launchNeeds.filter(Boolean),
        launchChecklist: launchChecklist.filter(Boolean),
        suggestedTechStack: suggestedTechStack.filter(Boolean),
        status: initialIdea?.status || 'draft',
      });

      const targetId = initialIdea?.id || saved?.id;
      if (targetId && onConvert) {
        await onConvert(targetId);
      }
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const updateListItem = (
    list: string[],
    setter: Dispatch<SetStateAction<string[]>>,
    index: number,
    value: string
  ) => {
    setter(list.map((item, itemIndex) => (itemIndex === index ? value : item)));
  };

  const removeListItem = (
    list: string[],
    setter: Dispatch<SetStateAction<string[]>>,
    index: number
  ) => {
    setter(list.filter((_, itemIndex) => itemIndex !== index));
  };

  const addListItem = (setter: Dispatch<SetStateAction<string[]>>) => {
    setter((current) => [...current, '']);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {initialIdea ? 'Refine Idea' : 'Add Idea'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="rounded-2xl border bg-muted/20 p-4">
            <div className="space-y-2">
              <Label htmlFor="idea-raw">Basic idea</Label>
              <Textarea
                id="idea-raw"
                value={rawIdea}
                onChange={(event) => setRawIdea(event.target.value)}
                placeholder="Explain the product idea, who it is for, and what you think it should do."
                className="min-h-32"
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={runAI} disabled={!canRunAI || isThinking}>
                {isThinking ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Distilling...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Distill With AI
                  </>
                )}
              </Button>
              <p className="text-sm text-muted-foreground">
                AI will sharpen the concept, GTM, launch needs, and starter checklist.
              </p>
            </div>
          </div>

          {stage !== 'ideation' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="idea-summary">Distilled idea</Label>
                <Textarea
                  id="idea-summary"
                  value={distilledSummary}
                  onChange={(event) => setDistilledSummary(event.target.value)}
                  placeholder="AI will tighten the concept into a crisp summary."
                  className="min-h-28"
                />
              </div>

              {stage === 'review' && (
                <div className="rounded-2xl border bg-muted/20 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="font-semibold">Create a project from this idea?</h3>
                      <p className="text-sm text-muted-foreground">
                        If yes, we’ll walk through the title, stack, launch plan, and starter checklist next.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" onClick={saveIdea}>
                        Save As Idea
                      </Button>
                      <Button type="button" onClick={() => setStage('project')}>
                        Yes, Continue
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {stage === 'project' && (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="idea-title">Project title</Label>
                      <Input
                        id="idea-title"
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        placeholder="Short working title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Suggested stack</Label>
                      <div className="flex min-h-11 flex-wrap gap-2 rounded-xl border bg-background px-3 py-2">
                        {suggestedTechStack.length > 0 ? (
                          suggestedTechStack.map((item) => (
                            <Badge key={item} variant="secondary">
                              {item}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">Run AI to suggest a stack.</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="idea-gtm">GTM strategy</Label>
                    <Textarea
                      id="idea-gtm"
                      value={gtmStrategy}
                      onChange={(event) => setGtmStrategy(event.target.value)}
                      placeholder="Target user, positioning, and first traction plan."
                      className="min-h-32"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-3 rounded-2xl border p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">Launch needs</h3>
                          <p className="text-sm text-muted-foreground">What must be true before launch.</p>
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={() => addListItem(setLaunchNeeds)}>
                          Add
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {launchNeeds.length > 0 ? (
                          launchNeeds.map((item, index) => (
                            <div key={`need-${index}`} className="flex items-start gap-2">
                              <Input
                                value={item}
                                onChange={(event) =>
                                  updateListItem(launchNeeds, setLaunchNeeds, index, event.target.value)
                                }
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeListItem(launchNeeds, setLaunchNeeds, index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">AI will list the key launch requirements here.</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3 rounded-2xl border p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">Initial checklist</h3>
                          <p className="text-sm text-muted-foreground">The first sequence of work to get moving.</p>
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={() => addListItem(setLaunchChecklist)}>
                          Add
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {launchChecklist.length > 0 ? (
                          launchChecklist.map((item, index) => (
                            <div key={`checklist-${index}`} className="flex items-start gap-2">
                              <Input
                                value={item}
                                onChange={(event) =>
                                  updateListItem(launchChecklist, setLaunchChecklist, index, event.target.value)
                                }
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeListItem(launchChecklist, setLaunchChecklist, index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">AI will generate the starting task list here.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
            <div className="flex gap-2">
              {initialIdea?.id && onDelete && (
                <Button type="button" variant="ghost" onClick={() => onDelete(initialIdea.id)}>
                  Delete
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              {stage === 'ideation' && (
                <Button type="button" variant="outline" onClick={saveIdea} disabled={!rawIdea.trim() || isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Draft'
                  )}
                </Button>
              )}
              {stage === 'project' && (
                <>
                  <Button type="button" variant="outline" onClick={() => setStage('review')}>
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={saveAndConvert}
                    disabled={!rawIdea.trim() || isSaving || !hasAIOutput}
                  >
                    <Bot className="mr-2 h-4 w-4" />
                    Create Project
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddIdeaDialog;
