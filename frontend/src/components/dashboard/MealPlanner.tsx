import React, { useState } from 'react';
import { Utensils, ShoppingCart, Plus, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface MealPlan {
  id: string;
  date: Date;
  meal_type: 'breakfast' | 'lunch' | 'dinner';
  recipe: string;
  ingredients: string[];
  servings: number;
}

interface GroceryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  purchased: boolean;
}

export default function MealPlanner() {
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [groceryList, setGroceryList] = useState<GroceryItem[]>([]);

  const addMealPlan = async (plan: Omit<MealPlan, 'id'>) => {
    try {
      // Add meal plan
      const { data: mealData, error: mealError } = await supabase
        .from('meal_plans')
        .insert({
          ...plan,
          user_id: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (mealError) throw mealError;

      // Create AI task for ingredient analysis
      await supabase.from('agent_interactions').insert({
        agent_id: 'data-analyzer',
        content: `Analyze ingredients for meal: ${plan.recipe}`,
        metadata: {
          meal_plan_id: mealData.id,
          ingredients: plan.ingredients
        }
      });

      setMealPlans(prev => [...prev, mealData]);
    } catch (error) {
      console.error('Failed to add meal plan:', error);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Meal Planning Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Meal Plans</h2>
          <button
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            <Plus className="w-5 h-5" />
            Add Meal
          </button>
        </div>

        <div className="space-y-4">
          {mealPlans.map(plan => (
            <div key={plan.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium">{plan.recipe}</h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {plan.date.toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Utensils className="w-4 h-4" />
                      {plan.meal_type}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grocery List Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Grocery List</h2>
          <button
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg"
          >
            <Plus className="w-5 h-5" />
            Add Item
          </button>
        </div>

        <div className="space-y-4">
          {groceryList.map(item => (
            <div key={item.id} className="flex items-center justify-between bg-white rounded-lg shadow p-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={item.purchased}
                  onChange={() => {/* Toggle purchased */}}
                  className="rounded text-blue-600"
                />
                <div>
                  <h3 className="font-medium">{item.name}</h3>
                  <p className="text-sm text-gray-500">
                    {item.quantity} {item.unit}
                  </p>
                </div>
              </div>
              <span className="text-sm text-gray-500">{item.category}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}