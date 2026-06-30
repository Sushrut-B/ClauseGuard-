import { Sequelize, DataTypes, Model, Optional } from 'sequelize'

export type PlanTier = 'free' | 'pro' | 'enterprise'
export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'incomplete'

interface SubscriptionAttributes {
  id: string
  orgId: string
  plan: PlanTier
  status: SubscriptionStatus
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
  stripePriceId: string | null
  currentPeriodEnd: Date | null
  cancelAtPeriodEnd: boolean
  createdAt?: Date
  updatedAt?: Date
}

interface SubscriptionCreationAttributes
  extends Optional<
    SubscriptionAttributes,
    | 'id'
    | 'stripeCustomerId'
    | 'stripeSubscriptionId'
    | 'stripePriceId'
    | 'currentPeriodEnd'
    | 'cancelAtPeriodEnd'
  > {}

export class Subscription
  extends Model<SubscriptionAttributes, SubscriptionCreationAttributes>
  implements SubscriptionAttributes
{
  public id!: string
  public orgId!: string
  public plan!: PlanTier
  public status!: SubscriptionStatus
  public stripeCustomerId!: string | null
  public stripeSubscriptionId!: string | null
  public stripePriceId!: string | null
  public currentPeriodEnd!: Date | null
  public cancelAtPeriodEnd!: boolean
  public readonly createdAt!: Date
  public readonly updatedAt!: Date
}

export const initSubscriptionModel = (sequelize: Sequelize) => {
  Subscription.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      orgId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
      },
      plan: {
        type: DataTypes.ENUM('free', 'pro', 'enterprise'),
        defaultValue: 'free',
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM(
          'active',
          'trialing',
          'past_due',
          'canceled',
          'incomplete'
        ),
        defaultValue: 'active',
        allowNull: false,
      },
      stripeCustomerId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      stripeSubscriptionId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      stripePriceId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      currentPeriodEnd: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      cancelAtPeriodEnd: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      sequelize,
      tableName: 'subscriptions',
      timestamps: true,
    }
  )
  return Subscription
}
