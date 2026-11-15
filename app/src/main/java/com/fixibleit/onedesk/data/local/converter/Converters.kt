package com.fixibleit.onedesk.data.local.converter

import androidx.room.TypeConverter
import com.fixibleit.onedesk.data.model.CashTxnType
import com.fixibleit.onedesk.data.model.CustomerTxnType
import com.fixibleit.onedesk.data.model.CylinderMaterial
import com.fixibleit.onedesk.data.model.CylinderTxnType
import com.fixibleit.onedesk.data.model.ReferenceType
import com.fixibleit.onedesk.data.model.RiceTxnType
import com.fixibleit.onedesk.data.model.SupplierTxnType
import com.fixibleit.onedesk.data.model.SyncOperation
import com.fixibleit.onedesk.data.model.SyncStatus
import com.fixibleit.onedesk.data.model.UserRole

class Converters {
    @TypeConverter fun userRoleToString(v: UserRole): String = v.name
    @TypeConverter fun stringToUserRole(v: String): UserRole = UserRole.valueOf(v)

    @TypeConverter fun syncStatusToString(v: SyncStatus): String = v.name
    @TypeConverter fun stringToSyncStatus(v: String): SyncStatus = SyncStatus.valueOf(v)

    @TypeConverter fun syncOperationToString(v: SyncOperation): String = v.name
    @TypeConverter fun stringToSyncOperation(v: String): SyncOperation = SyncOperation.valueOf(v)

    @TypeConverter fun cylinderMaterialToString(v: CylinderMaterial): String = v.name
    @TypeConverter fun stringToCylinderMaterial(v: String): CylinderMaterial = CylinderMaterial.valueOf(v)

    @TypeConverter fun cylinderTxnTypeToString(v: CylinderTxnType): String = v.name
    @TypeConverter fun stringToCylinderTxnType(v: String): CylinderTxnType = CylinderTxnType.valueOf(v)

    @TypeConverter fun riceTxnTypeToString(v: RiceTxnType): String = v.name
    @TypeConverter fun stringToRiceTxnType(v: String): RiceTxnType = RiceTxnType.valueOf(v)

    @TypeConverter fun customerTxnTypeToString(v: CustomerTxnType): String = v.name
    @TypeConverter fun stringToCustomerTxnType(v: String): CustomerTxnType = CustomerTxnType.valueOf(v)

    @TypeConverter fun supplierTxnTypeToString(v: SupplierTxnType): String = v.name
    @TypeConverter fun stringToSupplierTxnType(v: String): SupplierTxnType = SupplierTxnType.valueOf(v)

    @TypeConverter fun cashTxnTypeToString(v: CashTxnType): String = v.name
    @TypeConverter fun stringToCashTxnType(v: String): CashTxnType = CashTxnType.valueOf(v)

    @TypeConverter fun referenceTypeToString(v: ReferenceType): String = v.name
    @TypeConverter fun stringToReferenceType(v: String): ReferenceType = ReferenceType.valueOf(v)
}
