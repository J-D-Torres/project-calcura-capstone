/* Jaehyeong Shin wrote the original version of this file */
/* Jonathan Torres updated the UI styling and added Recharts visualizations */
import { useEffect, useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { TrendingUp, TrendingDown, DollarSign, CreditCard, PiggyBank, Target, Heart, ChevronDown, ChevronUp, Plus, Flag, Settings, ArrowRight } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

/* API URL */
const API_URL = import.meta.env.VITE_API_URL;

//remove later
console.log("API_URL =", API_URL);

interface DashboardPageProps {
  onCreateBudget?: () => void;
  onFinancialGoals?: () => void;
  onManageBudgets?: () => void;
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
  "#3b82f6",
  "#22c55e",
  "#eab308",
  "#a855f7",
  "#f97316",
  "#ef4444",
  "#06b6d4",
  "#ec4899",
  "#6366f1",
  "#84cc16",
  "#f59e0b",
  "#6b7280",
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
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: { cx: number; cy: number; midAngle: number; innerRadius: number; outerRadius: number; percent: number }) => {
  if (percent < 0.05) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export function DashboardPage({ onCreateBudget, onFinancialGoals, onManageBudgets }: DashboardPageProps) {
  const [userName, setUserName] = useState("John");
  const [userTemplates, setUserTemplates] = useState<TemplateOption[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [incomeTotal, setIncomeTotal] = useState(0);
  const [expenseRows, setExpenseRows] = useState<ExpenseRow[]>([]);
  const [debtRows, setDebtRows] = useState<DebtRow[]>([]);
  const [monthlyDonationsTotal, setMonthlyDonationsTotal] = useState(0);
  const [savingsAccountsTotal, setSavingsAccountsTotal] = useState(0);
  const [investingAccountsTotal, setInvestingAccountsTotal] = useState(0);
  const [savings501Total, setSavings501Total] = useState(0);
  const [investing601Total, setInvesting601Total] = useState(0);
  const [donationRows, setDonationRows] = useState<DebtRow[]>([]);
  const [savingsRows, setSavingsRows] = useState<DebtRow[]>([]);
  const [investingRows, setInvestingRows] = useState<DebtRow[]>([]);
  const [savings501Rows, setSavings501Rows] = useState<DebtRow[]>([]);
  const [investing601Rows, setInvesting601Rows] = useState<DebtRow[]>([]);
  const [expandDebt, setExpandDebt] = useState(false);
  const [expandDonations, setExpandDonations] = useState(false);
  const [expandSavings, setExpandSavings] = useState(false);
  const [expandInvesting, setExpandInvesting] = useState(false);
  const [expandSavings501, setExpandSavings501] = useState(false);
  const [expandInvesting601, setExpandInvesting601] = useState(false);
  const [syncError, setSyncError] = useState("");

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
      console.warn(`DashboardPage: Failed to load ${endpoint}`, err);
      return null;
    }
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      let userId: string | null = null;

      try {
        userId = localStorage.getItem("user_id");
      } catch (err) {
        console.warn("DashboardPage: Unable to read local user_id", err);
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
            console.warn("DashboardPage: Unable to auto-load template data", err);
          }
        }
      }
    };

    void loadDashboardData();
  }, []);

  useEffect(() => {
    if (!selectedTemplate) {
      return;
    }

    const refresh = async () => {
      try {
        await syncTemplateData(selectedTemplate);
      } catch (err) {
        console.warn("DashboardPage: Unable to sync selected template", err);
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
    const donationByName = new Map<string, number>();
    const savingsByName = new Map<string, number>();
    const investingByName = new Map<string, number>();
    const savings501ByName = new Map<string, number>();
    const investing601ByName = new Map<string, number>();
    let donationsTotal = 0;
    let savingsTotal = 0;
    let investingTotal = 0;
    let savings501 = 0;
    let investing601 = 0;

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

      const isDonation = itemCategoryId >= 400 && itemCategoryId < 500;
      if (isDonation) {
        donationByName.set(rowName, roundToCents((donationByName.get(rowName) ?? 0) + plannedAmount));
        donationsTotal = roundToCents(donationsTotal + plannedAmount);
        continue;
      }

      const isSavings = type ? type === "savings" : itemCategoryId >= 500 && itemCategoryId < 600;
      if (isSavings) {
        if (itemCategoryId === 501) {
          savings501 = roundToCents(savings501 + plannedAmount);
          savings501ByName.set(rowName, roundToCents((savings501ByName.get(rowName) ?? 0) + plannedAmount));
        } else {
          savingsTotal = roundToCents(savingsTotal + plannedAmount);
          savingsByName.set(rowName, roundToCents((savingsByName.get(rowName) ?? 0) + plannedAmount));
        }
        continue;
      }

      const isInvesting = type ? type === "investments" : itemCategoryId >= 600 && itemCategoryId < 700;
      if (isInvesting) {
        if (itemCategoryId === 601) {
          investing601 = roundToCents(investing601 + plannedAmount);
          investing601ByName.set(rowName, roundToCents((investing601ByName.get(rowName) ?? 0) + plannedAmount));
        } else {
          investingTotal = roundToCents(investingTotal + plannedAmount);
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
    setMonthlyDonationsTotal(donationsTotal);
    setSavingsAccountsTotal(savingsTotal);
    setInvestingAccountsTotal(investingTotal);
    setSavings501Total(savings501);
    setInvesting601Total(investing601);
    setDonationRows(Array.from(donationByName.entries()).map(([name, amount]) => ({ name, amount })));
    setSavingsRows(Array.from(savingsByName.entries()).map(([name, amount]) => ({ name, amount })));
    setInvestingRows(Array.from(investingByName.entries()).map(([name, amount]) => ({ name, amount })));
    setSavings501Rows(Array.from(savings501ByName.entries()).map(([name, amount]) => ({ name, amount })));
    setInvesting601Rows(Array.from(investing601ByName.entries()).map(([name, amount]) => ({ name, amount })));
  };

  const handleTemplateSync = async () => {
    if (!selectedTemplate) {
      alert("Please select a template first.");
      return;
    }

    try {
      await syncTemplateData(selectedTemplate);
    } catch (err) {
      console.error(err);
      setSyncError("Unable to refresh chart data from template items.");
    }
  };

  const totalExpenses = expenseRows.reduce((sum, item) => sum + item.amount, 0);
  const debtBalance = debtRows.reduce((sum, item) => sum + item.amount, 0);
  const totalOtherCosts = totalExpenses + debtBalance + monthlyDonationsTotal + savingsAccountsTotal + investingAccountsTotal;
  const finalBalance = incomeTotal - totalOtherCosts;

  // Pie chart data for expense breakdown
  const pieData = expenseRows.map((row) => ({
    name: row.name,
    value: row.amount,
    color: row.color,
  }));

  // Bar chart data for budget overview
  const unallocated = Math.max(incomeTotal - totalExpenses - debtBalance - monthlyDonationsTotal - savingsAccountsTotal - investingAccountsTotal, 0);
  const budgetOverviewData = [
    { name: "Expenses", amount: totalExpenses, fill: "#ef4444" },
    { name: "Debt", amount: debtBalance, fill: "#f97316" },
    { name: "Donations", amount: monthlyDonationsTotal, fill: "#ec4899" },
    { name: "Savings", amount: savingsAccountsTotal, fill: "#22c55e" },
    { name: "Investing", amount: investingAccountsTotal, fill: "#3b82f6" },
    { name: "Unallocated", amount: unallocated, fill: "#9ca3af" },
  ].filter((d) => d.amount > 0);

  // Collapsible detail rows component
  const DetailRows = ({ rows, expand, setExpand, color }: { rows: DebtRow[]; expand: boolean; setExpand: (v: boolean) => void; color?: string }) => (
    <>
      <button
        onClick={() => setExpand(!expand)}
        className="flex items-center gap-1 mt-2 text-xs text-gray-500 hover:text-gray-700"
      >
        {expand ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        {expand ? "Hide" : "Show"} details
      </button>
      {expand && (
        <div className="mt-2 space-y-1 border-t pt-2">
          {rows.map((item) => (
            <div key={item.name} className="flex justify-between text-xs text-gray-600">
              <span className="flex items-center gap-1.5">
                {color && <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: color }} />}
                {item.name}
              </span>
              <span>${item.amount.toLocaleString()}</span>
            </div>
          ))}
          {rows.length === 0 && <p className="text-xs text-gray-400">No items</p>}
        </div>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Header + Template Selector */}
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl text-gray-900 mb-1">Welcome back, {userName}!</h1>
            <p className="text-gray-600">Achieve your financial goals</p>
          </div>
          <Card className="p-4 w-full sm:w-72 shrink-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Template Source</span>
              <Button variant="ghost" size="sm" onClick={handleTemplateSync}>Sync</Button>
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
            {syncError && (
              <div className="mt-2 rounded border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700">
                {syncError}
              </div>
            )}
          </Card>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {(() => {
            const remaining = Math.max(incomeTotal - totalExpenses, 0);
            const slices = [
              { name: "Expenses", value: totalExpenses, color: "#ef4444" },
              { name: "Debt", value: debtBalance, color: "#f97316" },
              { name: "Donations", value: monthlyDonationsTotal, color: "#ec4899" },
              { name: "Savings", value: savingsAccountsTotal, color: "#22c55e" },
              { name: "Investing", value: investingAccountsTotal, color: "#3b82f6" },
              { name: "Unallocated", value: Math.max(finalBalance, 0), color: "#9ca3af" },
            ].filter((s) => s.value > 0);

            const colorMap: Record<string, string> = Object.fromEntries(slices.map((s) => [s.name, s.color]));
            colorMap["Remaining"] = "#3b82f6";

            const MiniTooltipContent = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) => {
              if (!active || !payload?.length) return null;
              const item = payload[0];
              const color = colorMap[item.name] ?? "#374151";
              return (
                <div className="rounded-md px-2 py-1 text-xs font-medium text-white shadow-lg" style={{ backgroundColor: color }}>
                  {item.name}: ${item.value.toLocaleString()}
                </div>
              );
            };

            const MiniPie = ({ highlight }: { highlight: string }) => (
              <PieChart width={80} height={80}>
                <Pie
                  data={slices}
                  cx={40}
                  cy={40}
                  innerRadius={18}
                  outerRadius={32}
                  dataKey="value"
                  strokeWidth={1}
                  stroke="#fff"
                >
                  {slices.map((s, i) => (
                    <Cell
                      key={i}
                      fill={s.name === highlight ? s.color : s.color + "30"}
                      style={s.name === highlight ? { filter: "drop-shadow(0 0 3px rgba(0,0,0,0.2))" } : undefined}
                    />
                  ))}
                </Pie>
                <Tooltip content={<MiniTooltipContent />} />
              </PieChart>
            );

            return (
              <>
                <Card className="p-6 !gap-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Income</span>
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-semibold text-gray-900">${incomeTotal.toLocaleString()}</div>
                    <PieChart width={80} height={80}>
                      <Pie data={slices} cx={40} cy={40} innerRadius={18} outerRadius={32} dataKey="value" strokeWidth={1} stroke="#fff">
                        {slices.map((s, i) => <Cell key={i} fill={s.color} />)}
                      </Pie>
                      <Tooltip content={<MiniTooltipContent />} />
                    </PieChart>
                  </div>
                </Card>

                <Card className="p-6 !gap-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Expenses</span>
                    <CreditCard className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-semibold text-gray-900">${totalExpenses.toLocaleString()}</div>
                    <MiniPie highlight="Expenses" />
                  </div>
                </Card>

                <Card className="p-6 !gap-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Remaining</span>
                    <Target className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-semibold text-gray-900">${remaining.toLocaleString()}</div>
                    {remaining > 0 ? (
                      <PieChart width={80} height={80}>
                        <Pie
                          data={[
                            { name: "Expenses", value: totalExpenses, color: "#ef444430" },
                            { name: "Remaining", value: remaining, color: "#3b82f6" },
                          ].filter((s) => s.value > 0)}
                          cx={40} cy={40} innerRadius={18} outerRadius={32} dataKey="value" strokeWidth={1} stroke="#fff"
                        >
                          <Cell fill="#ef444430" />
                          <Cell fill="#3b82f6" style={{ filter: "drop-shadow(0 0 3px rgba(0,0,0,0.2))" }} />
                        </Pie>
                        <Tooltip content={<MiniTooltipContent />} />
                      </PieChart>
                    ) : <div className="w-[80px] h-[80px]" />}
                  </div>
                </Card>

                <Card className="p-6 !gap-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Net Balance</span>
                    {finalBalance >= 0 ? <TrendingUp className="w-5 h-5 text-green-600" /> : <TrendingDown className="w-5 h-5 text-red-600" />}
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className={`text-2xl font-semibold ${finalBalance >= 0 ? "text-green-700" : "text-red-600"}`}>
                        ${finalBalance.toLocaleString()}
                      </div>
                      <span className="text-xs text-gray-500">After all costs</span>
                    </div>
                    <MiniPie highlight="Unallocated" />
                  </div>
                </Card>
              </>
            );
          })()}
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Expense Pie Chart */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Expense Breakdown</h2>
            {pieData.length > 0 ? (
              <div className="flex flex-col md:flex-row items-center gap-4">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomizedLabel}
                      outerRadius={110}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 min-w-[140px]">
                  {expenseRows.slice(0, 8).map((row) => (
                    <div key={row.name} className="flex items-center gap-2 text-xs">
                      <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: row.color }} />
                      <span className="text-gray-700 truncate">{row.name}</span>
                      <span className="text-gray-500 ml-auto">${row.amount.toLocaleString()}</span>
                    </div>
                  ))}
                  {expenseRows.length > 8 && (
                    <span className="text-xs text-gray-400">+{expenseRows.length - 8} more</span>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[260px] text-gray-400 text-sm">
                No expense data to display
              </div>
            )}
          </Card>

          {/* Budget Allocation Pie Chart */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Budget Allocation</h2>
            {budgetOverviewData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={budgetOverviewData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={100}
                    dataKey="amount"
                    labelLine={false}
                    label={renderCustomizedLabel}
                  >
                    {budgetOverviewData.map((entry, index) => (
                      <Cell key={`alloc-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                  <Legend formatter={(value: string) => <span className="text-xs text-gray-600">{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[260px] text-gray-400 text-sm">
                No budget data to display
              </div>
            )}
          </Card>
        </div>


        {/* Category Detail Cards - 2x3 grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {[
            { label: "Debt", amount: debtBalance, subtitle: "Monthly debt payments", icon: CreditCard, iconColor: "text-red-500", barColor: "#ef4444", subtitleColor: "text-red-600", rows: debtRows, expand: expandDebt, setExpand: setExpandDebt },
            { label: "Donations", amount: monthlyDonationsTotal, subtitle: "Monthly giving", icon: Heart, iconColor: "text-pink-500", barColor: "#ec4899", subtitleColor: "text-pink-600", rows: donationRows, expand: expandDonations, setExpand: setExpandDonations },
            { label: "Monthly Savings", amount: savingsAccountsTotal, subtitle: "Planned savings", icon: PiggyBank, iconColor: "text-green-500", barColor: "#22c55e", subtitleColor: "text-green-600", rows: savingsRows, expand: expandSavings, setExpand: setExpandSavings },
            { label: "Monthly Investing", amount: investingAccountsTotal, subtitle: "Planned investing", icon: TrendingUp, iconColor: "text-blue-500", barColor: "#3b82f6", subtitleColor: "text-blue-600", rows: investingRows, expand: expandInvesting, setExpand: setExpandInvesting },
            { label: "Savings Accounts", amount: savings501Total, subtitle: "Account balances", icon: PiggyBank, iconColor: "text-emerald-500", barColor: "#10b981", subtitleColor: "text-emerald-600", rows: savings501Rows, expand: expandSavings501, setExpand: setExpandSavings501 },
            { label: "Investment Accounts", amount: investing601Total, subtitle: "Account balances", icon: TrendingUp, iconColor: "text-indigo-500", barColor: "#6366f1", subtitleColor: "text-indigo-600", rows: investing601Rows, expand: expandInvesting601, setExpand: setExpandInvesting601 },
          ].map((card) => {
            const Icon = card.icon;
            const pct = incomeTotal > 0 ? Math.min((card.amount / incomeTotal) * 100, 100) : 0;
            return (
              <Card key={card.label} className="relative overflow-hidden p-6 !gap-0">
                <div className="absolute inset-x-0 bottom-0 transition-all" style={{ height: `${pct}%`, backgroundColor: card.barColor, opacity: 0.07 }} />
                <div className="relative flex gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500 uppercase tracking-wide">{card.label}</span>
                      <Icon className={`w-5 h-5 ${card.iconColor}`} />
                    </div>
                    <div className="text-2xl font-semibold text-gray-900 mb-1">${card.amount.toLocaleString()}</div>
                    <span className={`text-xs ${card.subtitleColor}`}>{card.subtitle}</span>
                  </div>
                  <div className="flex items-center shrink-0">
                    <svg width="56" height="56" viewBox="0 0 56 56">
                      <circle cx="28" cy="28" r="22" fill="none" stroke="#e5e7eb" strokeWidth="5" />
                      <circle cx="28" cy="28" r="22" fill="none" stroke={card.barColor} strokeWidth="5" strokeLinecap="round"
                        strokeDasharray={`${(pct / 100) * 2 * Math.PI * 22} ${2 * Math.PI * 22}`}
                        transform="rotate(-90 28 28)" />
                      <text x="28" y="30" textAnchor="middle" fontSize="11" fontWeight="600" fill="#374151">{Math.round(pct)}%</text>
                    </svg>
                  </div>
                </div>
                <div className="relative">
                  <DetailRows rows={card.rows} expand={card.expand} setExpand={card.setExpand} color={card.barColor} />
                </div>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6">
          <button
            className="group flex items-center gap-4 p-6 bg-white rounded-xl border border-gray-200 hover:border-green-400 hover:shadow-lg transition-all text-left"
            onClick={() => onCreateBudget?.()}
          >
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-green-200 transition-colors">
              <Plus className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-gray-900">Create New Budget</h3>
              <p className="text-sm text-gray-500">Start a new budget template</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-green-500 transition-colors" />
          </button>

          <button
            className="group flex items-center gap-4 p-6 bg-white rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all text-left"
            onClick={() => onFinancialGoals?.()}
          >
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-blue-200 transition-colors">
              <Flag className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-gray-900">Financial Goals</h3>
              <p className="text-sm text-gray-500">Set and track your goals</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors" />
          </button>

          <button
            className="group flex items-center gap-4 p-6 bg-white rounded-xl border border-gray-200 hover:border-purple-400 hover:shadow-lg transition-all text-left"
            onClick={() => onManageBudgets?.()}
          >
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-purple-200 transition-colors">
              <Settings className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-gray-900">Manage Budgets</h3>
              <p className="text-sm text-gray-500">Update or delete existing budgets</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-purple-500 transition-colors" />
          </button>
        </div>
      </div>
    </div>
  );
}
