/* Jaehyeong Shin wrote the original version of this file */
/* Jonathan Torres updated the UI styling and added Recharts visualizations */
import { useEffect, useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { TrendingUp, TrendingDown, DollarSign, CreditCard, Target, ChevronDown, ChevronUp } from "lucide-react";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";

/* API URL */
const API_URL = import.meta.env.VITE_API_URL;

interface RecommendBudgetPageProps {
  onCreateBudget?: () => void;
}

interface TemplateOption {
  id: number;
  name: string;
}

interface CategoryApi {
  category_id: number;
  name?: string;
  type?: string;
}

interface TemplateItemApi {
  template_id: number;
  category_id: number;
  planned_amt: number;
  item_name?: string;
  period?: "month" | "year";
}

interface ExpenseRow {
  name: string;
  amount: number;
  color: string;
}

interface DebtRow {
  name: string;
  amount: number;
}

const chartColors = [
  "bg-blue-500",
  "bg-green-500",
  "bg-yellow-500",
  "bg-purple-500",
  "bg-orange-500",
  "bg-red-500",
  "bg-cyan-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-lime-500",
  "bg-amber-500",
  "bg-gray-500",
];

const roundToCents = (value: number): number => Math.round(value * 100) / 100;

const toMonthlyAmount = (item: TemplateItemApi): number => {
  const amount = Number(item.planned_amt);
  if (!Number.isFinite(amount) || amount < 0) {
    return 0;
  }
  return item.period === "year" ? roundToCents(amount / 12) : roundToCents(amount);
};

const RADIAN = Math.PI / 180;
const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: { cx: number; cy: number; midAngle: number; innerRadius: number; outerRadius: number; percent: number }) => {
  if (percent < 0.05) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};


// 1. Breakdown row renderer
const BreakdownRows = ({ rows, total, show, toggle }: { rows: ExpenseRow[]; total: number; show: boolean; toggle: () => void }) => (
  <>
    <button type="button" onClick={toggle} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 mt-2">
      {show ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      {show ? "Hide" : "Show"} breakdown
    </button>
    {show && (
      rows.length > 0 ? (
        <div className="mt-3 space-y-2">
          {rows.map((row) => (
            <div key={row.name}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-700">{row.name}</span>
                <span className="text-xs text-gray-900">${row.amount.toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className={`${row.color} h-1.5 rounded-full transition-all`}
                  style={{ width: `${total > 0 ? Math.min((row.amount / total) * 100, 100) : 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-xs text-gray-400">No items found.</p>
      )
    )}
  </>
);

// 2. Category card for each budget section
const CategoryCard = ({ title, current, target, recommended, delta, meetsTarget, note, children }: {
  title: string;
  current: number;
  target: number | string;
  recommended: number;
  delta: number;
  meetsTarget: boolean;
  note?: string;
  children?: React.ReactNode;
}) => (
  <Card className="p-5 h-full flex flex-col">
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      <span className={`text-xs px-2 py-0.5 rounded-full ${meetsTarget ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
        {meetsTarget ? "On target" : "Needs adjustment"}
      </span>
    </div>
    <div className="grid grid-cols-4 gap-3 mb-3">
      <div className="text-center">
        <p className="text-[10px] text-gray-500 uppercase">Current</p>
        <p className="text-lg font-semibold text-gray-900">${current.toLocaleString()}</p>
      </div>
      <div className="text-center">
        <p className="text-[10px] text-gray-500 uppercase">Target</p>
        <p className="text-lg font-semibold text-gray-900">{typeof target === "string" ? target : `$${target.toLocaleString()}`}</p>
      </div>
      <div className="text-center">
        <p className="text-[10px] text-gray-500 uppercase">Recommended</p>
        <p className="text-lg font-semibold text-gray-900">${recommended.toLocaleString()}</p>
      </div>
      <div className="text-center">
        <p className="text-[10px] text-gray-500 uppercase">Adjust</p>
        <p className={`text-lg font-semibold ${delta < 0 ? "text-red-600" : delta > 0 ? "text-amber-600" : "text-green-700"}`}>
          {delta > 0 ? `+$${delta.toLocaleString()}` : delta < 0 ? `-$${Math.abs(delta).toLocaleString()}` : "$0"}
        </p>
      </div>
    </div>
    <div className="mt-auto">
      {note && <p className="text-xs text-amber-700 mb-1">{note}</p>}
      {children}
    </div>
  </Card>
);


export function RecommendBudgetPage({ onCreateBudget }: RecommendBudgetPageProps) {
  const [userName, setUserName] = useState("Guest");
  const [userTemplates, setUserTemplates] = useState<TemplateOption[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [incomeTotal, setIncomeTotal] = useState(0);
  const [expenseRows, setExpenseRows] = useState<ExpenseRow[]>([]);
  const [debtRows, setDebtRows] = useState<DebtRow[]>([]);
  const [givingRows, setGivingRows] = useState<ExpenseRow[]>([]);
  const [savingsRows, setSavingsRows] = useState<ExpenseRow[]>([]);
  const [investingRows, setInvestingRows] = useState<ExpenseRow[]>([]);
  const [givingTotal, setGivingTotal] = useState(0);
  const [savingsTotal, setSavingsTotal] = useState(0);
  const [investingTotal, setInvestingTotal] = useState(0);
  const [syncError, setSyncError] = useState("");
  const [showExpenseBreakdown, setShowExpenseBreakdown] = useState(false);
  const [showPersonalBreakdown, setShowPersonalBreakdown] = useState(false);
  const [showGivingBreakdown, setShowGivingBreakdown] = useState(false);
  const [showSavingsBreakdown, setShowSavingsBreakdown] = useState(false);
  const [showInvestingBreakdown, setShowInvestingBreakdown] = useState(false);
  const [showDebtBreakdown, setShowDebtBreakdown] = useState(false);

  const fetchJson = async <T,>(endpoint: string): Promise<T | null> => {
    if (!API_URL) {
      return null;
    }

    const baseUrl = String(API_URL).replace(/\/$/, "");
    const url = `${baseUrl}${endpoint}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Request failed (${response.status}) for ${endpoint}`);
      }
      return (await response.json()) as T;
    } catch (err) {
      console.warn(`RecommendBudgetPage: Failed to load ${endpoint}`, err);
      return null;
    }
  };

  useEffect(() => {
    const loadFinancialGoalData = async () => {
      let userId: string | null = null;

      try {
        userId = localStorage.getItem("user_id");
      } catch (err) {
        console.warn("RecommendBudgetPage: Unable to read local user_id", err);
        return;
      }

      if (!userId) {
        return;
      }

      const users = await fetchJson<any[]>("/users");
      if (Array.isArray(users)) {
        const user = users.find((u) => String(u.user_id) === String(userId));
        if (user?.name) {
          setUserName(user.name);
        }
      }

      const templates = await fetchJson<any[]>("/templates");
      if (Array.isArray(templates)) {
        const ownTemplates = templates
          .filter((t) => String(t.user_id) === String(userId))
          .map((t) => ({ id: t.template_id, name: t.name }));
        setUserTemplates(ownTemplates);
        if (ownTemplates.length > 0) {
          setSelectedTemplate(String(ownTemplates[0].id));
          try {
            await syncTemplateData(String(ownTemplates[0].id));
          } catch (err) {
            console.warn("RecommendBudgetPage: Unable to auto-load template data", err);
          }
        }
      }
    };

    void loadFinancialGoalData();
  }, []);

  useEffect(() => {
    if (!selectedTemplate) {
      return;
    }

    const refresh = async () => {
      try {
        await syncTemplateData(selectedTemplate);
      } catch (err) {
        console.warn("RecommendBudgetPage: Unable to sync selected template", err);
      }
    };

    void refresh();
  }, [selectedTemplate]);

  const syncTemplateData = async (templateId: string) => {
    setSyncError("");
    const items = await fetchJson<TemplateItemApi[]>("/template_items");
    if (!Array.isArray(items)) {
      throw new Error("Template items response was empty or invalid.");
    }

    const categories = await fetchJson<CategoryApi[]>("/categories");
    const categoryTypeById = new Map<number, string>();
    const categoryNameById = new Map<number, string>();
    if (Array.isArray(categories)) {
      for (const category of categories) {
        const categoryId = Number(category.category_id);
        categoryTypeById.set(categoryId, String(category.type ?? "").toLowerCase());
        categoryNameById.set(categoryId, String(category.name ?? "").trim());
      }
    }

    const selectedItems = items.filter((item) => Number(item.template_id) === Number(templateId));

    const incomeSum = roundToCents(
      selectedItems
        .filter((item) => {
          const categoryId = Number(item.category_id);
          const type = categoryTypeById.get(categoryId);
          return type ? type === "income" : categoryId === 101;
        })
        .reduce((sum, item) => sum + toMonthlyAmount(item), 0)
    );

    setIncomeTotal(incomeSum);

    const expenseByName = new Map<string, number>();
    const debtByName = new Map<string, number>();
    const givingByName = new Map<string, number>();
    const savingsByName = new Map<string, number>();
    const investingByName = new Map<string, number>();
    let givingSum = 0;
    let savingsSum = 0;
    let investingSum = 0;

    for (const item of selectedItems) {
      const itemCategoryId = Number(item.category_id);
      const type = categoryTypeById.get(itemCategoryId);
      const isExpense = type ? type === "expenses" : itemCategoryId >= 200 && itemCategoryId < 300;
      const itemName = typeof item.item_name === "string" ? item.item_name.trim() : "";
      const plannedAmount = toMonthlyAmount(item);
      if (plannedAmount <= 0) {
        continue;
      }

      const fallbackCategoryName = categoryNameById.get(itemCategoryId) ?? `Expense ${itemCategoryId}`;
      const rowName = itemName || fallbackCategoryName;

      if (isExpense) {
        expenseByName.set(rowName, roundToCents((expenseByName.get(rowName) ?? 0) + plannedAmount));
        continue;
      }

      const isDebt = type ? type === "debt" : itemCategoryId >= 300 && itemCategoryId < 400;
      if (isDebt) {
        debtByName.set(rowName, roundToCents((debtByName.get(rowName) ?? 0) + plannedAmount));
        continue;
      }

      const isGiving = itemCategoryId >= 400 && itemCategoryId < 500;
      if (isGiving) {
        givingSum = roundToCents(givingSum + plannedAmount);
        givingByName.set(rowName, roundToCents((givingByName.get(rowName) ?? 0) + plannedAmount));
        continue;
      }

      const isSavings = type ? type === "savings" : itemCategoryId >= 500 && itemCategoryId < 600;
      if (isSavings) {
        if (itemCategoryId === 511) {
          savingsSum = roundToCents(savingsSum + plannedAmount);
          savingsByName.set(rowName, roundToCents((savingsByName.get(rowName) ?? 0) + plannedAmount));
        }
        continue;
      }

      const isInvesting = type ? type === "investments" : itemCategoryId >= 600 && itemCategoryId < 700;
      if (isInvesting) {
        if (itemCategoryId === 611) {
          investingSum = roundToCents(investingSum + plannedAmount);
          investingByName.set(rowName, roundToCents((investingByName.get(rowName) ?? 0) + plannedAmount));
        }
      }
    }

    const rows = Array.from(expenseByName.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, amount], index) => ({
        name,
        amount,
        color: chartColors[index % chartColors.length],
      }));

    const debtList = Array.from(debtByName.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, amount]) => ({
        name,
        amount,
      }));

    setExpenseRows(rows);
    setDebtRows(debtList);
    setGivingTotal(givingSum);
    setSavingsTotal(savingsSum);
    setInvestingTotal(investingSum);

    const colorize = (map: Map<string, number>, offset = 0): ExpenseRow[] =>
      Array.from(map.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([name, amount], index) => ({
          name,
          amount,
          color: chartColors[(index + offset) % chartColors.length],
        }));

    setGivingRows(colorize(givingByName, 2));
    setSavingsRows(colorize(savingsByName, 4));
    setInvestingRows(colorize(investingByName, 6));
  };

  const handleUpdateIncome = async () => {
    if (!selectedTemplate) {
      alert("Please select a template first.");
      return;
    }

    try {
      await syncTemplateData(selectedTemplate);
    } catch (err) {
      console.error(err);
      setSyncError("Unable to refresh recommendation data from template items.");
    }
  };

  const totalExpenses = expenseRows.reduce((sum, item) => sum + item.amount, 0);
  const debtBalance = debtRows.reduce((sum, item) => sum + item.amount, 0);
  const housingExpense = expenseRows.find(
    (expense) => expense.name.trim().toLowerCase() === "housing/rent"
  )?.amount ?? 0;
  const housingTarget = roundToCents(incomeTotal * 0.25);
  const recommendedHousing = housingExpense > 0 && housingExpense < housingTarget
    ? housingExpense
    : housingTarget;
  const housingDelta = roundToCents(recommendedHousing - housingExpense);
  const hasHousingData = housingExpense > 0;
  const givingTarget = roundToCents(incomeTotal * 0.1);
  const recommendedGiving = givingTotal > givingTarget ? givingTotal : givingTarget;
  const givingDelta = roundToCents(recommendedGiving - givingTotal);
  const givingMeetsTarget = givingTotal >= givingTarget;
  const savingsTarget = roundToCents(incomeTotal * 0.1);
  const recommendedSavings = savingsTotal > savingsTarget ? savingsTotal : savingsTarget;
  const savingsMeetsTarget = savingsTotal >= savingsTarget;
  const investingTarget = roundToCents(incomeTotal * 0.1);
  const rawRecommendedInvesting = investingTotal > investingTarget ? investingTotal : investingTarget;
  const investingMeetsTarget = investingTotal >= investingTarget;
  const personalSpendingNames = ["entertainment", "dining out"];
  const personalSpendingTotal = roundToCents(
    expenseRows
      .filter((expense) => personalSpendingNames.includes(expense.name.trim().toLowerCase()))
      .reduce((sum, expense) => sum + expense.amount, 0)
  );
  const personalSpendingTarget = roundToCents(incomeTotal * 0.03);
  const recommendedPersonalSpending = personalSpendingTotal > personalSpendingTarget
    ? personalSpendingTarget
    : personalSpendingTotal;
  const personalSpendingDelta = roundToCents(recommendedPersonalSpending - personalSpendingTotal);
  const personalSpendingMeetsTarget = personalSpendingTotal <= personalSpendingTarget;
  const requiredExpensesTotal = roundToCents(
    expenseRows
      .filter((expense) => {
        const name = expense.name.trim().toLowerCase();
        return name !== "housing/rent" && !personalSpendingNames.includes(name);
      })
      .reduce((sum, expense) => sum + expense.amount, 0)
  );
  const requiredExpensesTarget = roundToCents(incomeTotal * 0.25);
  const recommendedRequiredExpenses = requiredExpensesTotal > requiredExpensesTarget
    ? requiredExpensesTarget
    : requiredExpensesTotal;
  const requiredExpensesDelta = roundToCents(recommendedRequiredExpenses - requiredExpensesTotal);
  const requiredExpensesMeetsTarget = requiredExpensesTotal <= requiredExpensesTarget;

  const rawRemainingFunds = roundToCents(
    incomeTotal - recommendedHousing - recommendedRequiredExpenses - recommendedPersonalSpending - recommendedGiving - recommendedSavings - rawRecommendedInvesting
  );
  const investingReduction = rawRemainingFunds < 0
    ? Math.min(Math.abs(rawRemainingFunds), rawRecommendedInvesting)
    : 0;
  const recommendedInvesting = roundToCents(rawRecommendedInvesting - investingReduction);
  const remainingRecommendedFunds = roundToCents(rawRemainingFunds + investingReduction);

  const debtShortfall = roundToCents(Math.max(0, debtBalance - Math.max(0, remainingRecommendedFunds)));
  const debtInvestingReduction = Math.min(debtShortfall, recommendedInvesting);
  const debtSavingsReduction = roundToCents(Math.min(debtShortfall - debtInvestingReduction, recommendedSavings));
  const adjustedRecommendedInvesting = roundToCents(recommendedInvesting - debtInvestingReduction);
  const adjustedRecommendedSavings = roundToCents(recommendedSavings - debtSavingsReduction);
  const adjustedRemainingFunds = roundToCents(remainingRecommendedFunds + debtInvestingReduction + debtSavingsReduction);
  const adjustedInvestingDelta = roundToCents(adjustedRecommendedInvesting - investingTotal);
  const adjustedSavingsDelta = roundToCents(adjustedRecommendedSavings - savingsTotal);

  const recommendedDebtPayoff = roundToCents(Math.max(0, adjustedRemainingFunds));
  const debtAdjustment = roundToCents(recommendedDebtPayoff - debtBalance);

  const finalBalance = roundToCents(
    incomeTotal - totalExpenses - debtBalance - givingTotal - savingsTotal - investingTotal
  );

  // Recommended allocation pie chart data
  const allocationPieData = [
    { name: "Housing", value: recommendedHousing, color: "#8b5cf6" },
    { name: "Required Expenses", value: recommendedRequiredExpenses, color: "#ef4444" },
    { name: "Personal", value: recommendedPersonalSpending, color: "#f97316" },
    { name: "Giving", value: recommendedGiving, color: "#ec4899" },
    { name: "Savings", value: adjustedRecommendedSavings, color: "#22c55e" },
    { name: "Investing", value: adjustedRecommendedInvesting, color: "#3b82f6" },
    { name: "Debt Payoff", value: recommendedDebtPayoff, color: "#f59e0b" },
  ].filter((d) => d.value > 0);

  // Current vs Recommended comparison bar chart data
  const comparisonData = [
    { name: "Housing", current: housingExpense, recommended: recommendedHousing },
    { name: "Req. Expenses", current: requiredExpensesTotal, recommended: recommendedRequiredExpenses },
    { name: "Personal", current: personalSpendingTotal, recommended: recommendedPersonalSpending },
    { name: "Giving", current: givingTotal, recommended: recommendedGiving },
    { name: "Savings", current: savingsTotal, recommended: adjustedRecommendedSavings },
    { name: "Investing", current: investingTotal, recommended: adjustedRecommendedInvesting },
    { name: "Debt", current: debtBalance, recommended: recommendedDebtPayoff },
  ].filter((d) => d.current > 0 || d.recommended > 0);

  // Adjustment summary data
  const adjustmentItems = [
    { name: "Housing / Rent", delta: housingDelta },
    { name: "Required Expenses", delta: requiredExpensesDelta },
    { name: "Personal Spending", delta: personalSpendingDelta },
    { name: "Giving", delta: givingDelta },
    { name: "Savings", delta: adjustedSavingsDelta },
    { name: "Investing", delta: adjustedInvestingDelta },
    { name: "Debt Contribution", delta: debtAdjustment },
  ];


  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header + Template Selector */}
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl text-gray-900 mb-1">Welcome back, {userName}!</h1>
            <p className="text-gray-600">Here is your recommended budget.</p>
          </div>
          <Card className="p-4 w-full sm:w-72 shrink-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Template Source</span>
              <Button variant="ghost" size="sm" onClick={handleUpdateIncome}>Sync</Button>
            </div>
            {userTemplates.length > 0 ? (
              <select
                className="w-full border rounded px-3 py-2 text-sm"
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
              >
                <option value="" disabled>Select a template</option>
                {userTemplates.map((template) => (
                  <option key={template.id} value={String(template.id)}>
                    {template.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-sm text-gray-500">No templates found.</div>
            )}
          </Card>
        </div>

        {syncError && (
          <div className="mb-6 rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {syncError}
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500 uppercase tracking-wide">Income</span>
              <DollarSign className="w-4 h-4 text-green-600" />
            </div>
            <div className="text-2xl font-semibold text-gray-900">${incomeTotal.toLocaleString()}</div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500 uppercase tracking-wide">Expenses</span>
              <CreditCard className="w-4 h-4 text-red-600" />
            </div>
            <div className="text-2xl font-semibold text-gray-900">${totalExpenses.toLocaleString()}</div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500 uppercase tracking-wide">Remaining</span>
              <Target className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-semibold text-gray-900">${(incomeTotal - totalExpenses).toLocaleString()}</div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500 uppercase tracking-wide">Net Balance</span>
              {finalBalance >= 0 ? <TrendingUp className="w-4 h-4 text-green-600" /> : <TrendingDown className="w-4 h-4 text-red-600" />}
            </div>
            <div className={`text-2xl font-semibold ${finalBalance >= 0 ? "text-green-700" : "text-red-600"}`}>
              ${finalBalance.toLocaleString()}
            </div>
            <span className="text-xs text-gray-500">After all costs</span>
          </Card>
        </div>

        {/* Charts: Recommended Allocation + Current vs Recommended */}
        {incomeTotal > 0 && (
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            {/* Recommended Allocation Pie */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recommended Allocation</h2>
              {allocationPieData.length > 0 ? (
                <div className="flex flex-col md:flex-row items-center gap-4">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={allocationPieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderPieLabel}
                        outerRadius={105}
                        dataKey="value"
                      >
                        {allocationPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5 min-w-[150px]">
                    {allocationPieData.map((item) => (
                      <div key={item.name} className="flex items-center gap-2 text-xs">
                        <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-gray-700">{item.name}</span>
                        <span className="text-gray-500 ml-auto">${item.value.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[250px] text-gray-400 text-sm">
                  No data to display
                </div>
              )}
            </Card>

            {/* Current vs Recommended Bar Chart */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Current vs Recommended</h2>
              {comparisonData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={comparisonData} margin={{ left: 10, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" fontSize={11} angle={-20} textAnchor="end" height={50} />
                    <YAxis tickFormatter={(v) => `$${v.toLocaleString()}`} fontSize={11} />
                    <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                    <Legend wrapperStyle={{ fontSize: "12px" }} />
                    <Bar dataKey="current" name="Current" fill="#94a3b8" radius={[3, 3, 0, 0]} barSize={18} />
                    <Bar dataKey="recommended" name="Recommended" fill="#3b82f6" radius={[3, 3, 0, 0]} barSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[250px] text-gray-400 text-sm">
                  No data to display
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Budget Category Cards */}
        {incomeTotal > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <CategoryCard
                title="Housing / Rent"
                current={housingExpense}
                target={housingTarget}
                recommended={recommendedHousing}
                delta={housingDelta}
                meetsTarget={!hasHousingData || housingExpense <= housingTarget}
              />

              <CategoryCard
                title="Required Expenses"
                current={requiredExpensesTotal}
                target={requiredExpensesTarget}
                recommended={recommendedRequiredExpenses}
                delta={requiredExpensesDelta}
                meetsTarget={requiredExpensesMeetsTarget}
              >
                <BreakdownRows
                  rows={expenseRows.filter((e) => !personalSpendingNames.includes(e.name.trim().toLowerCase()) && e.name.trim().toLowerCase() !== "housing/rent")}
                  total={requiredExpensesTotal}
                  show={showExpenseBreakdown}
                  toggle={() => setShowExpenseBreakdown((v) => !v)}
                />
              </CategoryCard>

              <CategoryCard
                title="Personal Spending"
                current={personalSpendingTotal}
                target={personalSpendingTarget}
                recommended={recommendedPersonalSpending}
                delta={personalSpendingDelta}
                meetsTarget={personalSpendingMeetsTarget}
              >
                <BreakdownRows
                  rows={expenseRows.filter((e) => personalSpendingNames.includes(e.name.trim().toLowerCase()))}
                  total={personalSpendingTotal}
                  show={showPersonalBreakdown}
                  toggle={() => setShowPersonalBreakdown((v) => !v)}
                />
              </CategoryCard>

              <CategoryCard
                title="Giving"
                current={givingTotal}
                target={givingTarget}
                recommended={recommendedGiving}
                delta={givingDelta}
                meetsTarget={givingMeetsTarget}
              >
                <BreakdownRows
                  rows={givingRows}
                  total={givingTotal}
                  show={showGivingBreakdown}
                  toggle={() => setShowGivingBreakdown((v) => !v)}
                />
              </CategoryCard>

              <CategoryCard
                title="Savings"
                current={savingsTotal}
                target={savingsTarget}
                recommended={adjustedRecommendedSavings}
                delta={adjustedSavingsDelta}
                meetsTarget={savingsMeetsTarget}
                note={debtSavingsReduction > 0 ? `$${debtSavingsReduction.toLocaleString()} redirected from savings to cover debt.` : undefined}
              >
                <BreakdownRows
                  rows={savingsRows}
                  total={savingsTotal}
                  show={showSavingsBreakdown}
                  toggle={() => setShowSavingsBreakdown((v) => !v)}
                />
              </CategoryCard>

              <CategoryCard
                title="Investing"
                current={investingTotal}
                target={investingTarget}
                recommended={adjustedRecommendedInvesting}
                delta={adjustedInvestingDelta}
                meetsTarget={investingMeetsTarget}
                note={debtInvestingReduction > 0 ? `$${debtInvestingReduction.toLocaleString()} redirected from investing to cover debt.` : undefined}
              >
                <BreakdownRows
                  rows={investingRows}
                  total={investingTotal}
                  show={showInvestingBreakdown}
                  toggle={() => setShowInvestingBreakdown((v) => !v)}
                />
              </CategoryCard>

              <CategoryCard
                title="Debt Contribution"
                current={debtBalance}
                target="Max"
                recommended={recommendedDebtPayoff}
                delta={debtAdjustment}
                meetsTarget={debtAdjustment >= 0}
                note={
                  (debtInvestingReduction > 0 || debtSavingsReduction > 0)
                    ? `To cover debt: ${[
                        debtInvestingReduction > 0 ? `$${debtInvestingReduction.toLocaleString()} from investing` : "",
                        debtSavingsReduction > 0 ? `$${debtSavingsReduction.toLocaleString()} from savings` : "",
                      ].filter(Boolean).join(", ")}`
                    : undefined
                }
              >
                <BreakdownRows
                  rows={debtRows.map((r) => ({ ...r, color: "bg-red-500" }))}
                  total={debtBalance}
                  show={showDebtBreakdown}
                  toggle={() => setShowDebtBreakdown((v) => !v)}
                />
              </CategoryCard>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              <Card className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">Remaining Funds</h2>
                    <p className="text-xs text-gray-500 mt-0.5">After all recommended allocations</p>
                  </div>
                  <span className={`text-2xl font-semibold ${adjustedRemainingFunds < 0 ? "text-red-600" : "text-gray-900"}`}>
                    ${adjustedRemainingFunds.toLocaleString()}
                  </span>
                </div>
              </Card>

              <Card className="p-5">
                <h2 className="text-base font-semibold text-gray-900 mb-3">Adjustment Summary</h2>
                <div className="divide-y">
                  {adjustmentItems.map(({ name, delta }) => (
                    <div key={name} className="flex items-center justify-between py-2">
                      <span className="text-sm text-gray-700">{name}</span>
                      <span className={`text-sm font-medium ${delta < 0 ? "text-red-600" : delta > 0 ? "text-green-700" : "text-gray-400"}`}>
                        {delta > 0
                          ? `+$${delta.toLocaleString()}`
                          : delta < 0
                          ? `-$${Math.abs(delta).toLocaleString()}`
                          : "On target"}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </>
        )}

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card
            className="p-5 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-green-500"
            onClick={() => onCreateBudget?.()}
          >
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Create New Budget</h3>
            <p className="text-xs text-gray-600">Start a new budget template</p>
          </Card>

          <Card className="p-5 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-blue-500">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Financial Goals</h3>
            <p className="text-xs text-gray-600">Set and track your goals</p>
          </Card>

          <Card className="p-5 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-purple-500">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">AI Recommendations</h3>
            <p className="text-xs text-gray-600">Get personalized insights</p>
          </Card>
        </div>
      </div>
    </div>
  );
}