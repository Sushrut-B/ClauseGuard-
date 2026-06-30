import { Sequelize, DataTypes, Model, Optional } from "sequelize"

export type ReminderType = "expiry" | "renewal" | "custom"
export type ReminderStatus = "pending" | "sent" | "failed" | "canceled"

interface ReminderAttributes {
  id: string
  orgId: string
  contractId: string
  userId: string
  type: ReminderType
  status: ReminderStatus
  triggerAt: Date
  message: string | null
  sentAt: Date | null
  createdAt?: Date
  updatedAt?: Date
}

interface ReminderCreationAttributes
  extends Optional<
    ReminderAttributes,
    "id" | "message" | "sentAt" | "status"
  > {}

export class Reminder
  extends Model<ReminderAttributes, ReminderCreationAttributes>
  implements ReminderAttributes
{
  public id!: string
  public orgId!: string
  public contractId!: string
  public userId!: string
  public type!: ReminderType
  public status!: ReminderStatus
  public triggerAt!: Date
  public message!: string | null
  public sentAt!: Date | null
  public readonly createdAt!: Date
  public readonly updatedAt!: Date
}

export const initReminderModel = (sequelize: Sequelize) => {
  Reminder.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      orgId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      contractId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM("expiry", "renewal", "custom"),
        allowNull: false,
        defaultValue: "expiry",
      },
      status: {
        type: DataTypes.ENUM("pending", "sent", "failed", "canceled"),
        allowNull: false,
        defaultValue: "pending",
      },
      triggerAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      sentAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: "reminders",
      timestamps: true,
    }
  )
  return Reminder
}
