import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Plus, Trash2, Check } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

interface GoalOption {
  id: number;
  name: string;
  target_amount: number;
  target_date: string | null;
  goal_type: string | null;
  apr: number | null;
  down_payment: number | null;
  interest: number | null;
}

interface SavingsGoal {
  id: string;
  goalId?: number;
  type: string;
  name: string;
  amount: string;
  timeframe: string;
  timeframePeriod: "months" | "years";
  apr: string;
  downPayment: string;
  interest: string;
}

const savingsGoalTypes = ["General Savings", "APR", "Mortgage"];

export function GoalSetPage({ onGoalSaved }: { onGoalSaved?: () => void }) {
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [activeUserEmail, setActiveUserEmail] = useState("");
  const [userGoals, setUserGoals] = useState<GoalOption[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState("");
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [isLoadingGoals, setIsLoadingGoals] = useState(false);
  const [goalLoadError, setGoalLoadError] = useState("");
  const [isDeletingGoal, setIsDeletingGoal] = useState(false);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);

  const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const addSavingsGoal = () => {
    setSavingsGoals((prev) => [
      ...prev,
      { id: createId(), type: "", name: "", amount: "", timeframe: "", timeframePeriod: "months", apr: "", downPayment: "", interest: "" },
    ]);
  };

  const updateSavingsGoal = (id: string, field: keyof SavingsGoal, value: string) => {
    setSavingsGoals((prev) =>
      prev.map((goal) => (goal.id === id ? { ...goal, [field]: value } : goal))
    );
  };

  const removeSavingsGoal = (id: string) => {
    setSavingsGoals((prev) => prev.filter((goal) => goal.id !== id));
  };

  const dateToTimeframe = (target_date: string | null): { timeframe: string; timeframePeriod: "months" | "years" } => {
    if (!target_date) return { timeframe: "", timeframePeriod: "months" };
    const today = new Date();
    const target = new Date(target_date);
    const diffMonths = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
    const clamped = Math.max(diffMonths, 0);
    if (clamped >= 12 && clamped % 12 === 0) {
      return { timeframe: String(clamped / 12), timeframePeriod: "years" };
    }
    return { timeframe: String(clamped), timeframePeriod: "months" };
  };

  const handleGoalSelect = (goalId: string) => {
    setSelectedGoalId(goalId);
    setIsCreatingNew(false);
    if (!goalId) {
      setSavingsGoals([]);
      return;
    }
    const found = userGoals.find((g) => String(g.id) === goalId);
    if (found) {
      const { timeframe, timeframePeriod } = dateToTimeframe(found.target_date);
      setSavingsGoals([{
        id: createId(),
        goalId: found.id,
        type: found.goal_type ?? "General Savings",
        name: found.name,
        amount: String(found.target_amount),
        timeframe,
        timeframePeriod,
        apr: found.apr != null ? String(Math.round(found.apr * 100 * 100) / 100) : "",
        downPayment: found.down_payment != null ? String(found.down_payment) : "",
        interest: found.interest != null ? String(Math.round(found.interest * 100 * 100) / 100) : "",
      }]);
    }
  };

  const handleCreateNew = () => {
    setIsCreatingNew(true);
    setSelectedGoalId("");
    setSavingsGoals([{ id: createId(), type: "", name: "", amount: "", timeframe: "", timeframePeriod: "months", apr: "", downPayment: "", interest: "" }]);
  };

  const deleteGoal = async () => {
    if (!selectedGoalId || !API_URL) return;
    if (!confirm("Are you sure you want to delete this goal?")) return;
    setIsDeletingGoal(true);
    try {
      await fetch(`${API_URL}/goals/${selectedGoalId}`, { method: "DELETE" });
      setUserGoals((prev) => prev.filter((g) => String(g.id) !== selectedGoalId));
      setSavingsGoals([]);
      setSelectedGoalId("");
      setIsCreatingNew(false);
    } catch (error) {
      console.error(error);
      alert("Unable to delete goal. Please try again.");
    } finally {
      setIsDeletingGoal(false);
    }
  };

  const saveGoals = async () => {
    if (!currentUserId || !API_URL) return;

    const goalsToSave = savingsGoals.filter((g) => g.name.trim());
    if (goalsToSave.length === 0) return;

    try {
      await Promise.all(
        goalsToSave.map((goal) => {
          let targetDate: string | null = null;
          if (goal.timeframe) {
            const months =
              goal.timeframePeriod === "years"
                ? Number(goal.timeframe) * 12
                : Number(goal.timeframe);
            const date = new Date();
            date.setMonth(date.getMonth() + months);
            targetDate = date.toISOString().slice(0, 10);
          }
          const body = JSON.stringify({
            user_id: currentUserId,
            name: goal.name,
            target_amount: goal.amount ? parseFloat(goal.amount) : 0,
            target_date: targetDate,
            apr: goal.apr ? parseFloat(goal.apr) / 100 : null,
            down_payment: goal.downPayment ? parseFloat(goal.downPayment) : null,
            interest: goal.interest ? parseFloat(goal.interest) / 100 : null,
            goal_type: goal.type || null,
          });
          if (goal.goalId) {
            return fetch(`${API_URL}/goals/${goal.goalId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body,
            });
          }
          return fetch(`${API_URL}/goals/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body,
          });
        })
      );
      alert("Goals saved successfully!");
      setSavingsGoals([]);
      setSelectedGoalId("");
      setIsCreatingNew(false);
      setUserGoals((prev) => prev.filter((g) => String(g.id) !== selectedGoalId));
      onGoalSaved?.();
    } catch (error) {
      console.error(error);
      alert("Unable to save goals. Please try again.");
    }
  };

  useEffect(() => {
    const userEmail = localStorage.getItem("email");
    if (userEmail) setActiveUserEmail(userEmail);
    const userId = localStorage.getItem("user_id");
    if (userId) setCurrentUserId(Number(userId));
  }, []);

  useEffect(() => {
    if (!currentUserId || !API_URL) return;

    const loadUserGoals = async () => {
      setIsLoadingGoals(true);
      try {
        const response = await fetch(`${API_URL}/goals/`);
        if (!response.ok) throw new Error(`Failed loading goals: ${response.status}`);
        const goals = (await response.json()) as Array<{ goal_id: number; user_id: number; name: string; target_amount: number; target_date: string | null; goal_type: string | null; apr: number | null; down_payment: number | null; interest: number | null }>;
        const owned = goals
          .filter((g) => Number(g.user_id) === Number(currentUserId))
          .map((g) => ({ id: g.goal_id, name: g.name, target_amount: g.target_amount, target_date: g.target_date, goal_type: g.goal_type, apr: g.apr, down_payment: g.down_payment, interest: g.interest }));
        setUserGoals(owned);
      } catch (error) {
        console.error(error);
        setGoalLoadError("Unable to load your goals right now.");
      } finally {
        setIsLoadingGoals(false);
      }
    };

    void loadUserGoals();
  }, [currentUserId]);

  const showGoalsCard = selectedGoalId !== "" || isCreatingNew;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-gray-900 mb-2">Set Your Goals</h1>
          {activeUserEmail && (
            <p className="text-sm text-gray-500 mb-1">Signed in as: {activeUserEmail}</p>
          )}
          <p className="text-gray-600">Select an existing goal to edit, or create a new one.</p>
        </div>

        {/* Select / Create Goal Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Select Existing Goal</CardTitle>
            <CardDescription>Choose a goal you already created to load and edit.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <select
              className="w-full border rounded px-3 py-2"
              value={selectedGoalId}
              onChange={(e) => handleGoalSelect(e.target.value)}
            >
              <option value="">Select a goal</option>
              {userGoals.map((goal) => (
                <option key={goal.id} value={String(goal.id)}>
                  {goal.name}
                </option>
              ))}
            </select>

            {isLoadingGoals && <p className="text-sm text-gray-500">Loading goals...</p>}
            {goalLoadError && <p className="text-sm text-red-600">{goalLoadError}</p>}
            {!isLoadingGoals && userGoals.length === 0 && !goalLoadError && (
              <p className="text-sm text-gray-500">No goals found for your account.</p>
            )}

            <div className="pt-2">
              <h4 className="leading-none mb-2">or</h4>
              <Button variant="outline" onClick={handleCreateNew} className="w-full">
                <Plus className="mr-2 w-4 h-4" /> Create New Goal
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Savings Goals Card – shown when a goal is selected or creating new */}
        {showGoalsCard && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Savings Goals</CardTitle>
              <CardDescription>Add savings goals to work toward.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {savingsGoals.map((goal) => (
                <div key={goal.id} className="space-y-3">
                  <div className="flex gap-3 items-end">
                    <div className="flex-1 space-y-2">
                      <Label>Goal Type</Label>
                      <Select
                        value={goal.type}
                        onValueChange={(value: string) => updateSavingsGoal(goal.id, "type", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select goal type" />
                        </SelectTrigger>
                        <SelectContent>
                          {savingsGoalTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1 space-y-2">
                      <Label>Name</Label>
                      <Input
                        type="text"
                        placeholder="Goal name"
                        value={goal.name}
                        onChange={(e) => updateSavingsGoal(goal.id, "name", e.target.value)}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => removeSavingsGoal(goal.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  {goal.type === "General Savings" && (
                    <div className="flex gap-3 items-end">
                      <div className="flex-1 space-y-2">
                        <Label>Amount</Label>
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={goal.amount}
                          onChange={(e) => updateSavingsGoal(goal.id, "amount", e.target.value)}
                        />
                      </div>
                      <div className="flex-1 space-y-2">
                        <Label>Timeframe</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={goal.timeframe}
                          onChange={(e) => updateSavingsGoal(goal.id, "timeframe", e.target.value)}
                        />
                      </div>
                      <div className="w-36 shrink-0 space-y-2">
                        <Label>Period</Label>
                        <Select
                          value={goal.timeframePeriod}
                          onValueChange={(value: "months" | "years") =>
                            updateSavingsGoal(goal.id, "timeframePeriod", value)
                          }
                        >
                          <SelectTrigger style={{ width: "9rem", minWidth: "9rem", maxWidth: "9rem" }}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="months">Months</SelectItem>
                            <SelectItem value="years">Years</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                  {goal.type === "APR" && (
                    <>
                      <div className="flex gap-3 items-end">
                        <div className="flex-1 space-y-2">
                          <Label>Amount</Label>
                          <Input
                            type="number"
                            placeholder="0.00"
                            value={goal.amount}
                            onChange={(e) => updateSavingsGoal(goal.id, "amount", e.target.value)}
                          />
                        </div>
                        <div className="flex-1 space-y-2">
                          <Label>Timeframe</Label>
                          <Input
                            type="number"
                            placeholder="0"
                            value={goal.timeframe}
                            onChange={(e) => updateSavingsGoal(goal.id, "timeframe", e.target.value)}
                          />
                        </div>
                        <div className="w-36 shrink-0 space-y-2">
                          <Label>Period</Label>
                          <Select
                            value={goal.timeframePeriod}
                            onValueChange={(value: "months" | "years") =>
                              updateSavingsGoal(goal.id, "timeframePeriod", value)
                            }
                          >
                            <SelectTrigger style={{ width: "9rem", minWidth: "9rem", maxWidth: "9rem" }}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="months">Months</SelectItem>
                              <SelectItem value="years">Years</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex gap-3 items-end">
                        <div className="flex-1 space-y-2">
                          <Label>APR (%)</Label>
                          <Input
                            type="number"
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            value={goal.apr}
                            onChange={(e) => updateSavingsGoal(goal.id, "apr", e.target.value)}
                          />
                        </div>
                      </div>
                    </>
                  )}
                  {goal.type === "Mortgage" && (
                    <>
                      <div className="flex gap-3 items-end">
                        <div className="flex-1 space-y-2">
                          <Label>Amount</Label>
                          <Input
                            type="number"
                            placeholder="0.00"
                            value={goal.amount}
                            onChange={(e) => updateSavingsGoal(goal.id, "amount", e.target.value)}
                          />
                        </div>
                        <div className="flex-1 space-y-2">
                          <Label>Timeframe</Label>
                          <Input
                            type="number"
                            placeholder="0"
                            value={goal.timeframe}
                            onChange={(e) => updateSavingsGoal(goal.id, "timeframe", e.target.value)}
                          />
                        </div>
                        <div className="w-36 shrink-0 space-y-2">
                          <Label>Period</Label>
                          <Select
                            value={goal.timeframePeriod}
                            onValueChange={(value: "months" | "years") =>
                              updateSavingsGoal(goal.id, "timeframePeriod", value)
                            }
                          >
                            <SelectTrigger style={{ width: "9rem", minWidth: "9rem", maxWidth: "9rem" }}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="months">Months</SelectItem>
                              <SelectItem value="years">Years</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex gap-3 items-end">
                        <div className="flex-1 space-y-2">
                          <Label>Down Payment</Label>
                          <Input
                            type="number"
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            value={goal.downPayment}
                            onChange={(e) => updateSavingsGoal(goal.id, "downPayment", e.target.value)}
                          />
                        </div>
                        <div className="flex-1 space-y-2">
                          <Label>Interest (%)</Label>
                          <Input
                            type="number"
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            value={goal.interest}
                            onChange={(e) => updateSavingsGoal(goal.id, "interest", e.target.value)}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}

            </CardContent>
          </Card>
        )}

        {showGoalsCard && savingsGoals.length > 0 && (
          <div className="flex justify-end gap-3 mb-8">
            <Button onClick={() => { void saveGoals(); }} className="bg-green-600 hover:bg-green-700">
              <Check className="mr-2 w-4 h-4" />
              Save Goals
            </Button>
            {selectedGoalId && (
              <Button
                variant="destructive"
                onClick={() => { void deleteGoal(); }}
                disabled={isDeletingGoal}
              >
                {isDeletingGoal ? "Deleting..." : "Delete Goal"}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
