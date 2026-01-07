import React, { useState, useMemo } from 'react';
import { AlertCircle, TrendingDown, DollarSign, Calendar } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const FinancialAdvisorGame = () => {
  const [gameState, setGameState] = useState('intro'); // intro, scenario, calculation, diagnosis, feedback
  const [scenario, setScenario] = useState(null);
  const [projections, setProjections] = useState(null);
  const [selectedConcern, setSelectedConcern] = useState([]); // Array of concern IDs
  const [feedback, setFeedback] = useState(null);

  const colors = {
    blue: '#003e7e',
    green: '#008953',
    gold: '#c68c00',
    danger: '#e74c3c',
    warning: '#f39c12',
    lightBg: '#f8f9fa',
    border: '#e0e5eb',
  };

  // Procedural scenario generator
  const generateScenario = () => {
    const names = ['Alex', 'Jordan', 'Taylor', 'Casey', 'Morgan', 'Riley', 'Avery', 'Quinn'];
    
    // Careers tied to realistic locations and 2026 COL
    const careers = [
      { title: 'Nursing', startSalary: 62000, salary5yr: 72000, jobGrowth: 'strong', location: 'Mid-size city', monthlyBaseExpenses: 2200 },
      { title: 'Software Engineer (MAG 7)', startSalary: 200000, salary5yr: 250000, jobGrowth: 'strong', location: 'San Francisco', monthlyBaseExpenses: 4500 },
      { title: 'High School Teacher', startSalary: 42000, salary5yr: 50000, jobGrowth: 'weak', location: 'Suburban', monthlyBaseExpenses: 1800 },
      { title: 'Business Analyst', startSalary: 58000, salary5yr: 72000, jobGrowth: 'moderate', location: 'Austin/Denver', monthlyBaseExpenses: 2400 },
      { title: 'Social Worker', startSalary: 38000, salary5yr: 42000, jobGrowth: 'weak', location: 'Mid-size city', monthlyBaseExpenses: 1900 },
      { title: 'Mechanical Engineer', startSalary: 72000, salary5yr: 92000, jobGrowth: 'strong', location: 'Austin/Denver', monthlyBaseExpenses: 2500 },
    ];

    const educationPaths = [
      { name: 'Community College (2yr)', years: 2, costPerYear: 6500 },
      { name: 'State University (4yr)', years: 4, costPerYear: 16000 },
      { name: 'Private University (4yr)', years: 4, costPerYear: 32000 },
      { name: 'Bootcamp (6mo)', years: 0.5, costPerYear: 14000 },
    ];

    const dependents = [0, 0, 0, 1, 2]; // Weighted toward no dependents
    const existingDebt = [0, 0, 5000, 12000, 25000];

    const careerChoice = careers[Math.floor(Math.random() * careers.length)];
    const educationPath = educationPaths[Math.floor(Math.random() * educationPaths.length)];
    const numDependents = dependents[Math.floor(Math.random() * dependents.length)];
    const currentDebt = existingDebt[Math.floor(Math.random() * existingDebt.length)];

    const totalEducationCost = educationPath.costPerYear * educationPath.years;
    const studentWillWork = Math.random() > 0.5; // 50% will work
    const annualIncomeWhileStudying = studentWillWork ? 18000 : 0;
    
    // Monthly expenses: base + childcare at $1800/month per child in 2026
    const monthlyExpenses = careerChoice.monthlyBaseExpenses + (numDependents * 1800);

    return {
      name: names[Math.floor(Math.random() * names.length)],
      age: 18 + Math.floor(Math.random() * 6),
      career: careerChoice.title,
      location: careerChoice.location,
      startSalary: careerChoice.startSalary,
      salary5yr: careerChoice.salary5yr,
      jobGrowth: careerChoice.jobGrowth,
      educationPath: educationPath.name,
      yearsInSchool: educationPath.years,
      educationCostPerYear: educationPath.costPerYear,
      totalEducationCost,
      currentDebt,
      dependents: numDependents,
      monthlyExpenses,
      willWorkDuringSchool: studentWillWork,
      annualIncomeWhileStudying,
      federalLoanRate: 0.05,
      loanRepaymentYears: 10,
    };
  };

  // Calculate 10-year projection with proper debt repayment
  const calculateProjection = (scen) => {
    let data = [];
    let debt = scen.currentDebt;
    let monthlyDebtPayment = 0;
    let debtWhenRepaymentStarts = 0;

    // First pass: calculate total debt at graduation
    for (let year = 1; year <= scen.yearsInSchool; year++) {
      const annualEducationCost = scen.educationCostPerYear;
      const annualIncome = scen.annualIncomeWhileStudying;
      const annualLivingExpenses = scen.monthlyExpenses * 12;
      const totalAnnualExpenses = annualEducationCost + annualLivingExpenses;
      
      // Add unpaid costs to debt
      const deficit = Math.max(0, totalAnnualExpenses - annualIncome);
      debt += deficit;
      
      // Compound interest on debt
      const interestAccrued = debt * scen.federalLoanRate;
      debt += interestAccrued;
    }

    debtWhenRepaymentStarts = debt;

    // Calculate fixed monthly payment using standard student loan formula
    // P = L[c(1 + c)^n]/[(1 + c)^n - 1] where c = monthly rate, n = months
    const monthlyRate = scen.federalLoanRate / 12;
    const numberOfMonths = scen.loanRepaymentYears * 12;
    if (debtWhenRepaymentStarts > 0 && monthlyRate > 0) {
      const numerator = debtWhenRepaymentStarts * monthlyRate * Math.pow(1 + monthlyRate, numberOfMonths);
      const denominator = Math.pow(1 + monthlyRate, numberOfMonths) - 1;
      monthlyDebtPayment = numerator / denominator;
    }

    // Reset debt for full projection
    debt = scen.currentDebt;

    for (let year = 1; year <= 10; year++) {
      let salary = 0;
      let annualExpenses = scen.monthlyExpenses * 12;
      let annualIncome = 0;
      let yearsPostGrad = year - scen.yearsInSchool;
      let annualDebtPayment = 0;

      // School phase
      if (year <= scen.yearsInSchool) {
        annualExpenses += scen.educationCostPerYear;
        annualIncome = scen.annualIncomeWhileStudying;
        
        // Accumulate unpaid costs as debt
        const deficit = Math.max(0, annualExpenses - annualIncome);
        debt += deficit;
        
        // Compound interest on debt
        const interestAccrued = debt * scen.federalLoanRate;
        debt += interestAccrued;
      } 
      // Post-graduation phase
      else {
        if (yearsPostGrad === 1) {
          salary = scen.startSalary;
        } else if (yearsPostGrad <= 5) {
          const progress = (yearsPostGrad - 1) / 4;
          salary = scen.startSalary + (scen.salary5yr - scen.startSalary) * progress;
        } else {
          salary = scen.salary5yr + (scen.salary5yr * 0.02 * (yearsPostGrad - 5));
        }
        
        annualIncome = salary;
        annualDebtPayment = monthlyDebtPayment * 12;

        // Apply debt payment and interest
        for (let month = 0; month < 12; month++) {
          // Monthly interest
          const monthlyInterest = debt * monthlyRate;
          debt += monthlyInterest;
          
          // Monthly payment (reduces debt)
          debt = Math.max(0, debt - monthlyDebtPayment);
        }
      }

      // Taxes (rough estimate: 20% effective rate)
      const taxesOwed = Math.max(0, annualIncome * 0.20);
      const afterTaxIncome = annualIncome - taxesOwed;

      // Debt-to-income ratio
      const debtToIncomeRatio = annualIncome > 0 ? (annualDebtPayment / annualIncome) * 100 : 0;

      // Monthly surplus/deficit
      const monthlyIncome = afterTaxIncome / 12;
      const monthlySurplus = monthlyIncome - (scen.monthlyExpenses + monthlyDebtPayment);

      // Net worth (simplified)
      const netWorth = (year > scen.yearsInSchool ? (afterTaxIncome * (year - scen.yearsInSchool)) : 0) - Math.max(0, debt);

      data.push({
        year,
        debt: Math.round(Math.max(0, debt)),
        salary: Math.round(annualIncome),
        monthlyDebtPayment: Math.round(monthlyDebtPayment),
        annualDebtPayment: Math.round(annualDebtPayment),
        debtToIncomeRatio: Math.round(debtToIncomeRatio * 10) / 10,
        monthlySurplus: Math.round(monthlySurplus),
        netWorth: Math.round(netWorth),
        isSchool: year <= scen.yearsInSchool,
      });
    }

    return data;
  };

  // All possible concern types that could appear
  const allPossibleConcernTypes = [
    {
      id: 'debt_burden',
      title: 'High Debt-to-Income Ratio',
      description: 'Debt payments consume too much of monthly income',
      threshold: (firstJob, scen) => firstJob && firstJob.debtToIncomeRatio > 20,
    },
    {
      id: 'school_deficit',
      title: 'Monthly Deficit During School',
      description: 'Expenses exceed income while studying',
      threshold: (firstJob, scen, projections) => {
        const schoolYears = projections.filter(p => p.isSchool);
        return schoolYears.some(y => y.monthlySurplus < -500);
      },
    },
    {
      id: 'dependent_burden',
      title: 'Supporting Dependents on Entry Salary',
      description: 'Dependent costs too high relative to starting income',
      threshold: (firstJob, scen) => scen.dependents > 0 && firstJob && firstJob.salary < 50000,
    },
    {
      id: 'extended_debt',
      title: 'Debt Extends Beyond 10 Years',
      description: 'Significant debt remaining after decade of repayment',
      threshold: (firstJob, scen, projections) => {
        const finalYear = projections[projections.length - 1];
        return finalYear.debt > 5000;
      },
    },
    {
      id: 'job_market',
      title: 'Weak Job Market for This Career',
      description: 'Limited growth prospects in chosen field',
      threshold: (firstJob, scen) => scen.jobGrowth === 'weak',
    },
    {
      id: 'high_education_cost',
      title: 'High Education Cost Relative to Starting Salary',
      description: 'Education expense is disproportionate to entry salary',
      threshold: (firstJob, scen) => firstJob && scen.totalEducationCost > (firstJob.salary * 0.4),
    },
    {
      id: 'location_salary_mismatch',
      title: 'Salary May Not Match Cost of Living',
      description: 'Starting salary seems low for the location',
      threshold: (firstJob, scen) => {
        // MAG 7 in SF is fine, but $42k teacher in Boston is tough
        if (scen.location === 'San Francisco') return firstJob && firstJob.salary < 120000;
        if (scen.location === 'Austin/Denver') return firstJob && firstJob.salary < 50000;
        return false;
      },
    },
    {
      id: 'no_work_income',
      title: 'No Income During School',
      description: 'Full-time student with no part-time work',
      threshold: (firstJob, scen) => scen.annualIncomeWhileStudying === 0,
    },
  ];

  // Generate concerns for this specific scenario
  const identifyConcerns = (scen, projections) => {
    const firstJobYear = projections.find(p => !p.isSchool);
    
    return allPossibleConcernTypes
      .map(concern => ({
        ...concern,
        applies: concern.threshold(firstJobYear, scen, projections),
      }))
      .filter(concern => concern.applies)
      .map(concern => {
        // Generate specific numbers for the actual concerns
        const finalYear = projections[projections.length - 1];
        const schoolYears = projections.filter(p => p.isSchool);
        
        let numbers = '';
        switch (concern.id) {
          case 'debt_burden':
            numbers = `$${firstJobYear.monthlyDebtPayment}/month debt payment vs $${Math.round(firstJobYear.salary / 12)}/month salary (${firstJobYear.debtToIncomeRatio}% DTI)`;
            break;
          case 'school_deficit':
            numbers = `Around $${Math.abs(Math.round(schoolYears[0].monthlySurplus))}/month shortfall`;
            break;
          case 'dependent_burden':
            const childSupport = scen.dependents * 600;
            numbers = `Dependent costs: $${childSupport * 12}/year. Entry salary: $${firstJobYear.salary}/year`;
            break;
          case 'extended_debt':
            numbers = `Remaining debt: $${finalYear.debt.toLocaleString()}`;
            break;
          case 'job_market':
            numbers = `Job growth: ${scen.jobGrowth}. Salary plateau: $${scen.salary5yr}/year`;
            break;
          case 'high_education_cost':
            const costRatio = Math.round((scen.totalEducationCost / firstJobYear.salary) * 100);
            numbers = `Education cost: $${scen.totalEducationCost.toLocaleString()} vs first year salary: $${firstJobYear.salary.toLocaleString()} (${costRatio}% of salary)`;
            break;
          case 'location_salary_mismatch':
            numbers = `${scen.location} - Starting salary $${firstJobYear.salary.toLocaleString()}, monthly expenses $${scen.monthlyExpenses.toLocaleString()}`;
            break;
          case 'no_work_income':
            numbers = `${scen.yearsInSchool} years of school with $0 income`;
            break;
          default:
            numbers = '';
        }
        
        return {
          ...concern,
          numbers,
        };
      });
  };

  // Generate template versions of all concerns for display (without filtering for whether they apply)
  const generateAllConcernDisplay = (scen, projections) => {
    const firstJobYear = projections.find(p => !p.isSchool);
    const finalYear = projections[projections.length - 1];
    const schoolYears = projections.filter(p => p.isSchool);

    return allPossibleConcernTypes.map(concern => {
      let numbers = '';
      const applies = concern.threshold(firstJobYear, scen, projections);

      switch (concern.id) {
        case 'debt_burden':
          numbers = `$${firstJobYear.monthlyDebtPayment}/month debt payment vs $${Math.round(firstJobYear.salary / 12)}/month salary (${firstJobYear.debtToIncomeRatio}% DTI)`;
          break;
        case 'school_deficit':
          numbers = `Around $${Math.abs(Math.round(schoolYears[0]?.monthlySurplus || 0))}/month shortfall`;
          break;
        case 'dependent_burden':
          const childSupport = scen.dependents * 600;
          numbers = `Dependent costs: $${childSupport * 12}/year. Entry salary: $${firstJobYear.salary}/year`;
          break;
        case 'extended_debt':
          numbers = `Remaining debt: $${finalYear.debt.toLocaleString()}`;
          break;
        case 'job_market':
          numbers = `Job growth: ${scen.jobGrowth}. Salary plateau: $${scen.salary5yr}/year`;
          break;
        case 'high_education_cost':
          const costRatio = Math.round((scen.totalEducationCost / firstJobYear.salary) * 100);
          numbers = `Education cost: $${scen.totalEducationCost.toLocaleString()} vs first year salary: $${firstJobYear.salary.toLocaleString()} (${costRatio}% of salary)`;
          break;
        case 'location_salary_mismatch':
          numbers = `${scen.location} - Starting salary $${firstJobYear.salary.toLocaleString()}, monthly expenses $${scen.monthlyExpenses.toLocaleString()}`;
          break;
        case 'no_work_income':
          numbers = `${scen.yearsInSchool} years of school with $0 income`;
          break;
        default:
          numbers = '';
      }

      return {
        id: concern.id,
        title: concern.title,
        description: concern.description,
        numbers,
        applies,
      };
    });
  };

  const handleStartGame = () => {
    const newScenario = generateScenario();
    const newProjections = calculateProjection(newScenario);
    setScenario(newScenario);
    setProjections(newProjections);
    setGameState('scenario');
  };

  const handleCalculate = () => {
    const concerns = identifyConcerns(scenario, projections);
    setGameState('diagnosis');
  };

  const handleSelectConcern = (concernId) => {
    if (selectedConcern.includes(concernId)) {
      setSelectedConcern(selectedConcern.filter(id => id !== concernId));
    } else {
      setSelectedConcern([...selectedConcern, concernId]);
    }
  };

  const handleSubmitDiagnosis = () => {
    const actualConcerns = identifyConcerns(scenario, projections);
    const actualConcernIds = actualConcerns.map(c => c.id);
    
    // Score: how many did they identify correctly?
    const correctIdentifications = selectedConcern.filter(id => actualConcernIds.includes(id)).length;
    const missed = actualConcernIds.filter(id => !selectedConcern.includes(id));
    const falsePositives = selectedConcern.filter(id => !actualConcernIds.includes(id));
    
    const score = Math.round((correctIdentifications / Math.max(1, actualConcernIds.length)) * 100);
    
    setFeedback({
      correctIdentifications,
      totalConcerns: actualConcernIds.length,
      missedConcerns: missed.map(id => actualConcerns.find(c => c.id === id)),
      falsePositives,
      score,
      allConcerns: actualConcerns,
    });
    setGameState('feedback');
  };

  const handleContinue = () => {
    setGameState('intro');
    setScenario(null);
    setProjections(null);
    setSelectedConcern([]);
    setFeedback(null);
  };

  // ==================== RENDER ====================

  if (gameState === 'intro') {
    return (
      <div style={{ background: colors.lightBg, minHeight: '100vh', padding: '1rem', display: 'flex', alignItems: 'center' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
          <h1 style={{ color: colors.blue, fontSize: '2rem', fontWeight: 'bold', margin: '0 0 1rem 0' }}>
            Financial Reality Check
          </h1>
          <p style={{ color: '#666', fontSize: '1.05rem', lineHeight: '1.6', marginBottom: '2rem' }}>
            Meet a student making a big decision. Calculate their 10-year financial picture. Find where the math doesn't add up. Then have the conversation they need to have.
          </p>

          <button
            onClick={handleStartGame}
            style={{
              background: colors.green,
              color: 'white',
              border: 'none',
              padding: '1rem 2rem',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              borderRadius: '50px',
              cursor: 'pointer',
              width: '100%',
            }}
          >
            Meet Your Next Student
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'scenario' && scenario) {
    const concerns = identifyConcerns(scenario, projections);
    
    return (
      <div style={{ background: colors.lightBg, minHeight: '100vh', paddingBottom: '2rem' }}>
        {/* Header */}
        <div style={{
          background: 'white',
          borderBottom: `4px solid ${colors.blue}`,
          padding: '1.5rem 1rem',
        }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h1 style={{ color: colors.blue, margin: '0 0 0.5rem 0', fontSize: '1.8rem' }}>
              {scenario.name}, Age {scenario.age}
            </h1>
            <p style={{ color: '#666', margin: 0, fontSize: '0.95rem' }}>
              Plans to study {scenario.career} via {scenario.educationPath} ({scenario.yearsInSchool} years)
            </p>
          </div>
        </div>

        {/* Questionnaire */}
        <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '0 1rem' }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '2rem',
            border: `1px solid ${colors.border}`,
            marginBottom: '2rem',
          }}>
            <h2 style={{ color: colors.blue, marginTop: 0 }}>Their Plan</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#999', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Career Goal</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: colors.blue }}>{scenario.career}</div>
                <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>
                  Expected starting salary: ${scenario.startSalary.toLocaleString()}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.8rem', color: '#999', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Education Path</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: colors.blue }}>{scenario.educationPath}</div>
                <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>
                  Cost: ${scenario.totalEducationCost.toLocaleString()}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.8rem', color: '#999', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Current Debt</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: colors.blue }}>${scenario.currentDebt.toLocaleString()}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.8rem', color: '#999', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Dependents</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: colors.blue }}>{scenario.dependents} {scenario.dependents === 1 ? 'child' : 'children'}</div>
                {scenario.dependents > 0 && (
                  <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>
                    ~${scenario.dependents * 600 * 12}/year for childcare, food
                  </div>
                )}
              </div>

              <div>
                <div style={{ fontSize: '0.8rem', color: '#999', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Monthly Expenses</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: colors.blue }}>${scenario.monthlyExpenses.toLocaleString()}</div>
                <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>Housing, food, utilities, childcare</div>
              </div>

              <div>
                <div style={{ fontSize: '0.8rem', color: '#999', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Work During School</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: colors.blue }}>
                  {scenario.willWorkDuringSchool ? 'Yes' : 'No'}
                </div>
                {scenario.willWorkDuringSchool && (
                  <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>
                    ~${scenario.annualIncomeWhileStudying}/year part-time work
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Chart */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '1.5rem',
            border: `1px solid ${colors.border}`,
            marginBottom: '2rem',
          }}>
            <h3 style={{ color: colors.blue, marginTop: 0 }}>10-Year Debt Projection</h3>
            <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>
              If they follow this plan, here's how their debt will accumulate:
            </p>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={projections}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip
                  formatter={(value) => `$${value.toLocaleString()}`}
                  labelFormatter={(label) => `Year ${label}`}
                  contentStyle={{ background: 'white', border: `1px solid ${colors.border}` }}
                />
                <Area type="monotone" dataKey="debt" fill={colors.danger} stroke={colors.danger} opacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <button
            onClick={handleCalculate}
            style={{
              background: colors.gold,
              color: colors.blue,
              border: 'none',
              padding: '1rem 2rem',
              fontSize: '1rem',
              fontWeight: 'bold',
              borderRadius: '50px',
              cursor: 'pointer',
              width: '100%',
            }}
          >
            Now Let's Look at the Numbers
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'diagnosis' && scenario && projections) {
    const allConcernsForDisplay = generateAllConcernDisplay(scenario, projections);
    const firstJobYear = projections.find(p => !p.isSchool);

    return (
      <div style={{ background: colors.lightBg, minHeight: '100vh', paddingBottom: '2rem' }}>
        {/* Header */}
        <div style={{
          background: colors.blue,
          color: 'white',
          padding: '1.5rem 1rem',
        }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ margin: 0, fontSize: '1.3rem' }}>What Stands Out to You?</h2>
            <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9, fontSize: '0.95rem' }}>
              Look at the numbers. Select everything that concerns you.
            </p>
          </div>
        </div>

        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 1rem' }}>
          {/* Key Financial Snapshot */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '1.5rem',
            border: `1px solid ${colors.border}`,
            marginTop: '2rem',
            marginBottom: '2rem',
          }}>
            <h3 style={{ color: colors.blue, marginTop: 0 }}>10-Year Snapshot</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#999', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                  Career
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: colors.blue }}>
                  {scenario.career}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>
                  {scenario.location}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.8rem', color: '#999', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                  Education Cost
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: colors.blue }}>
                  ${scenario.totalEducationCost.toLocaleString()}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.8rem', color: '#999', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                  Year 1 Salary
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: colors.green }}>
                  ${firstJobYear.salary.toLocaleString()}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.8rem', color: '#999', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                  Year 10 Remaining Debt
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: colors.danger }}>
                  ${projections[projections.length - 1].debt.toLocaleString()}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.8rem', color: '#999', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                  Monthly Expenses (Year 1)
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: colors.blue }}>
                  ${scenario.monthlyExpenses.toLocaleString()}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.8rem', color: '#999', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                  Monthly Debt Payment
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: colors.danger }}>
                  ${firstJobYear.monthlyDebtPayment.toLocaleString()}
                </div>
              </div>
            </div>

            <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: '1rem' }}>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={projections}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => `$${value.toLocaleString()}`}
                    labelFormatter={(label) => `Year ${label}`}
                    contentStyle={{ background: 'white', border: `1px solid ${colors.border}` }}
                  />
                  <Line
                    type="monotone"
                    dataKey="debt"
                    stroke={colors.danger}
                    strokeWidth={2}
                    dot={false}
                    name="Remaining Debt"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Concerns Checklist - NOW SHOWS ALL */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '2rem',
            border: `1px solid ${colors.border}`,
            marginBottom: '2rem',
          }}>
            <h3 style={{ color: colors.blue, marginTop: 0 }}>Potential Concerns</h3>
            <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Which of these would you want to discuss with {scenario.name}? Evaluate each one carefully.
            </p>

            <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
              {allConcernsForDisplay.map((concern) => (
                <label
                  key={concern.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    padding: '1rem',
                    border: selectedConcern.includes(concern.id) ? `2px solid ${colors.gold}` : `1px solid ${colors.border}`,
                    borderRadius: '8px',
                    background: selectedConcern.includes(concern.id) ? '#fffbf0' : 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (!selectedConcern.includes(concern.id)) {
                      e.currentTarget.style.background = '#f9f9f9';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!selectedConcern.includes(concern.id)) {
                      e.currentTarget.style.background = 'white';
                    }
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedConcern.includes(concern.id)}
                    onChange={() => handleSelectConcern(concern.id)}
                    style={{
                      width: '20px',
                      height: '20px',
                      marginRight: '1rem',
                      marginTop: '0.2rem',
                      cursor: 'pointer',
                      accentColor: colors.gold,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontWeight: 'bold',
                      color: colors.blue,
                      marginBottom: '0.25rem',
                      fontSize: '1rem',
                    }}>
                      {concern.title}
                    </div>
                    <div style={{ color: '#666', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '0.5rem' }}>
                      {concern.description}
                    </div>
                    <div style={{
                      color: '#999',
                      fontSize: '0.85rem',
                      fontFamily: 'monospace',
                      background: colors.lightBg,
                      padding: '0.5rem',
                      borderRadius: '4px',
                    }}>
                      {concern.numbers}
                    </div>
                  </div>
                </label>
              ))}
            </div>

            <button
              onClick={handleSubmitDiagnosis}
              style={{
                background: colors.blue,
                color: 'white',
                border: 'none',
                padding: '1rem 2rem',
                fontSize: '1rem',
                fontWeight: 'bold',
                borderRadius: '50px',
                cursor: 'pointer',
                width: '100%',
              }}
            >
              Submit Your Diagnosis ({selectedConcern.length} selected)
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'feedback' && feedback && scenario) {
    return (
      <div style={{ background: colors.lightBg, minHeight: '100vh', paddingBottom: '2rem' }}>
        <div style={{
          background: feedback.score >= 80 ? colors.green : feedback.score >= 60 ? colors.gold : colors.danger,
          color: 'white',
          padding: '1.5rem 1rem',
        }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ margin: 0, fontSize: '1.3rem' }}>Your Diagnosis</h2>
          </div>
        </div>

        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 1rem' }}>
          {/* Score Card */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '2rem',
            border: `1px solid ${colors.border}`,
            marginTop: '2rem',
            marginBottom: '2rem',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              {feedback.score >= 80 ? '✓' : feedback.score >= 60 ? '◐' : '✗'}
            </div>
            <div style={{
              fontSize: '2.5rem',
              color: feedback.score >= 80 ? colors.green : feedback.score >= 60 ? colors.gold : colors.danger,
              fontWeight: 'bold',
              marginBottom: '0.5rem',
            }}>
              {feedback.score}%
            </div>
            <p style={{ color: '#666', fontSize: '1rem', marginTop: '1rem' }}>
              You identified {feedback.correctIdentifications} of {feedback.totalConcerns} concerns
            </p>
          </div>

          {/* Results */}
          {feedback.missedConcerns && feedback.missedConcerns.length > 0 && (
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '2rem',
              border: `2px solid ${colors.warning}`,
              marginBottom: '2rem',
            }}>
              <h3 style={{ color: colors.blue, marginTop: 0, marginBottom: '1rem' }}>
                You Missed ({feedback.missedConcerns.length})
              </h3>
              <div style={{ display: 'grid', gap: '1rem' }}>
                {feedback.missedConcerns.map((concern) => (
                  <div key={concern.id} style={{
                    background: colors.lightBg,
                    padding: '1rem',
                    borderRadius: '8px',
                    borderLeft: `4px solid ${colors.warning}`,
                  }}>
                    <div style={{ fontWeight: 'bold', color: colors.blue, marginBottom: '0.25rem' }}>
                      {concern.title}
                    </div>
                    <div style={{ color: '#666', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                      {concern.description}
                    </div>
                    <div style={{
                      color: '#999',
                      fontSize: '0.85rem',
                      fontFamily: 'monospace',
                    }}>
                      {concern.numbers}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {feedback.falsePositives && feedback.falsePositives.length > 0 && (
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '2rem',
              border: `2px solid ${colors.gold}`,
              marginBottom: '2rem',
            }}>
              <h3 style={{ color: colors.blue, marginTop: 0, marginBottom: '1rem' }}>
                Not Actually Concerns ({feedback.falsePositives.length})
              </h3>
              <div style={{ display: 'grid', gap: '1rem' }}>
                {feedback.falsePositives.map((concernId) => {
                  const allConcerns = generateAllConcernDisplay(scenario, projections);
                  const concern = allConcerns.find(c => c.id === concernId);
                  if (!concern) return null;
                  return (
                    <div key={concernId} style={{
                      background: colors.lightBg,
                      padding: '1rem',
                      borderRadius: '8px',
                      borderLeft: `4px solid ${colors.gold}`,
                    }}>
                      <div style={{ fontWeight: 'bold', color: colors.blue, marginBottom: '0.25rem' }}>
                        {concern.title}
                      </div>
                      <div style={{ color: '#666', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                        {concern.description}
                      </div>
                      <div style={{
                        color: '#999',
                        fontSize: '0.85rem',
                        fontFamily: 'monospace',
                      }}>
                        {concern.numbers}
                      </div>
                      <p style={{ color: colors.gold, fontSize: '0.85rem', marginTop: '0.5rem', marginBottom: 0 }}>
                        ✗ The numbers don't actually support this concern.
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {feedback.correctIdentifications === feedback.totalConcerns && feedback.totalConcerns > 0 && (
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '2rem',
              border: `2px solid ${colors.green}`,
              marginBottom: '2rem',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>✓</div>
              <h3 style={{ color: colors.blue, marginTop: 0 }}>Perfect Diagnosis</h3>
              <p style={{ color: '#666' }}>
                You caught all the mathematical incongruencies. You'd give {scenario.name} solid financial guidance.
              </p>
            </div>
          )}

          <button
            onClick={() => {
              setGameState('intro');
              setScenario(null);
              setProjections(null);
              setSelectedConcern([]);
              setFeedback(null);
            }}
            style={{
              background: colors.blue,
              color: 'white',
              border: 'none',
              padding: '1rem 2rem',
              fontSize: '1rem',
              fontWeight: 'bold',
              borderRadius: '50px',
              cursor: 'pointer',
              width: '100%',
            }}
          >
            Assess Another Student
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default FinancialAdvisorGame;