var log = require('logger')('mongutils');

exports.errors = {};

exports.errors.OK = 0;
exports.errors.InternalError = 1;
exports.errors.BadValue = 2;
exports.errors.OBSOLETE_DuplicateKey = 3;
exports.errors.NoSuchKey = 4;
exports.errors.GraphContainsCycle = 5;
exports.errors.HostUnreachable = 6;
exports.errors.HostNotFound = 7;
exports.errors.UnknownError = 8;
exports.errors.FailedToParse = 9;
exports.errors.CannotMutateObject = 10;
exports.errors.UserNotFound = 11;
exports.errors.UnsupportedFormat = 12;
exports.errors.Unauthorized = 13;
exports.errors.TypeMismatch = 14;
exports.errors.Overflow = 15;
exports.errors.InvalidLength = 16;
exports.errors.ProtocolError = 17;
exports.errors.AuthenticationFailed = 18;
exports.errors.CannotReuseObject = 19;
exports.errors.IllegalOperation = 20;
exports.errors.EmptyArrayOperation = 21;
exports.errors.InvalidBSON = 22;
exports.errors.AlreadyInitialized = 23;
exports.errors.LockTimeout = 24;
exports.errors.RemoteValidationError = 25;
exports.errors.NamespaceNotFound = 26;
exports.errors.IndexNotFound = 27;
exports.errors.PathNotViable = 28;
exports.errors.NonExistentPath = 29;
exports.errors.InvalidPath = 30;
exports.errors.RoleNotFound = 31;
exports.errors.RolesNotRelated = 32;
exports.errors.PrivilegeNotFound = 33;
exports.errors.CannotBackfillArray = 34;
exports.errors.UserModificationFailed = 35;
exports.errors.RemoteChangeDetected = 36;
exports.errors.FileRenameFailed = 37;
exports.errors.FileNotOpen = 38;
exports.errors.FileStreamFailed = 39;
exports.errors.ConflictingUpdateOperators = 40;
exports.errors.FileAlreadyOpen = 41;
exports.errors.LogWriteFailed = 42;
exports.errors.CursorNotFound = 43;
exports.errors.UserDataInconsistent = 45;
exports.errors.LockBusy = 46;
exports.errors.NoMatchingDocument = 47;
exports.errors.NamespaceExists = 48;
exports.errors.InvalidRoleModification = 49;
exports.errors.ExceededTimeLimit = 50;
exports.errors.ManualInterventionRequired = 51;
exports.errors.DollarPrefixedFieldName = 52;
exports.errors.InvalidIdField = 53;
exports.errors.NotSingleValueField = 54;
exports.errors.InvalidDBRef = 55;
exports.errors.EmptyFieldName = 56;
exports.errors.DottedFieldName = 57;
exports.errors.RoleModificationFailed = 58;
exports.errors.CommandNotFound = 59;
exports.errors.OBSOLETE_DatabaseNotFound = 60;
exports.errors.ShardKeyNotFound = 61;
exports.errors.OplogOperationUnsupported = 62;
exports.errors.StaleShardVersion = 63;
exports.errors.WriteConcernFailed = 64;
exports.errors.MultipleErrorsOccurred = 65;
exports.errors.ImmutableField = 66;
exports.errors.CannotCreateIndex = 67;
exports.errors.IndexAlreadyExists = 68;
exports.errors.AuthSchemaIncompatible = 69;
exports.errors.ShardNotFound = 70;
exports.errors.ReplicaSetNotFound = 71;
exports.errors.InvalidOptions = 72;
exports.errors.InvalidNamespace = 73;
exports.errors.NodeNotFound = 74;
exports.errors.WriteConcernLegacyOK = 75;
exports.errors.NoReplicationEnabled = 76;
exports.errors.OperationIncomplete = 77;
exports.errors.CommandResultSchemaViolation = 78;
exports.errors.UnknownReplWriteConcern = 79;
exports.errors.RoleDataInconsistent = 80;
exports.errors.NoMatchParseContext = 81;
exports.errors.NoProgressMade = 82;
exports.errors.RemoteResultsUnavailable = 83;
exports.errors.DuplicateKeyValue = 84;
exports.errors.IndexOptionsConflict = 85;
exports.errors.IndexKeySpecsConflict = 86;
exports.errors.CannotSplit = 87;
exports.errors.SplitFailed_OBSOLETE = 88;
exports.errors.NetworkTimeout = 89;
exports.errors.CallbackCanceled = 90;
exports.errors.ShutdownInProgress = 91;
exports.errors.SecondaryAheadOfPrimary = 92;
exports.errors.InvalidReplicaSetConfig = 93;
exports.errors.NotYetInitialized = 94;
exports.errors.NotSecondary = 95;
exports.errors.OperationFailed = 96;
exports.errors.NoProjectionFound = 97;
exports.errors.DBPathInUse = 98;
exports.errors.CannotSatisfyWriteConcern = 100;
exports.errors.OutdatedClient = 101;
exports.errors.IncompatibleAuditMetadata = 102;
exports.errors.NewReplicaSetConfigurationIncompatible = 103;
exports.errors.NodeNotElectable = 104;
exports.errors.IncompatibleShardingMetadata = 105;
exports.errors.DistributedClockSkewed = 106;
exports.errors.LockFailed = 107;
exports.errors.InconsistentReplicaSetNames = 108;
exports.errors.ConfigurationInProgress = 109;
exports.errors.CannotInitializeNodeWithData = 110;
exports.errors.NotExactValueField = 111;
exports.errors.WriteConflict = 112;
exports.errors.InitialSyncFailure = 113;
exports.errors.InitialSyncOplogSourceMissing = 114;
exports.errors.CommandNotSupported = 115;
exports.errors.DocTooLargeForCapped = 116;
exports.errors.ConflictingOperationInProgress = 117;
exports.errors.NamespaceNotSharded = 118;
exports.errors.InvalidSyncSource = 119;
exports.errors.OplogStartMissing = 120;
exports.errors.DocumentValidationFailure = 121;
exports.errors.OBSOLETE_ReadAfterOptimeTimeout = 122;
exports.errors.NotAReplicaSet = 123;
exports.errors.IncompatibleElectionProtocol = 124;
exports.errors.CommandFailed = 125;
exports.errors.RPCProtocolNegotiationFailed = 126;
exports.errors.UnrecoverableRollbackError = 127;
exports.errors.LockNotFound = 128;
exports.errors.LockStateChangeFailed = 129;
exports.errors.SymbolNotFound = 130;
exports.errors.RLPInitializationFailed = 131;
exports.errors.ConfigServersInconsistent = 132;
exports.errors.FailedToSatisfyReadPreference = 133;
exports.errors.ReadConcernMajorityNotAvailableYet = 134;
exports.errors.StaleTerm = 135;
exports.errors.CappedPositionLost = 136;
exports.errors.IncompatibleShardingConfigVersion = 137;
exports.errors.RemoteOplogStale = 138;
exports.errors.JSInterpreterFailure = 139;
exports.errors.InvalidSSLConfiguration = 140;
exports.errors.SSLHandshakeFailed = 141;
exports.errors.JSUncatchableError = 142;
exports.errors.CursorInUse = 143;
exports.errors.IncompatibleCatalogManager = 144;
exports.errors.PooledConnectionsDropped = 145;
exports.errors.ExceededMemoryLimit = 146;
exports.errors.ZLibError = 147;
exports.errors.ReadConcernMajorityNotEnabled = 148;
exports.errors.NoConfigMaster = 149;
exports.errors.StaleEpoch = 150;
exports.errors.OperationCannotBeBatched = 151;
exports.errors.OplogOutOfOrder = 152;
exports.errors.ChunkTooBig = 153;
exports.errors.InconsistentShardIdentity = 154;
exports.errors.CannotApplyOplogWhilePrimary = 155;
exports.errors.NeedsDocumentMove = 156;
exports.errors.CanRepairToDowngrade = 157;
exports.errors.MustUpgrade = 158;
exports.errors.DurationOverflow = 159;
exports.errors.MaxStalenessOutOfRange = 160;
exports.errors.IncompatibleCollationVersion = 161;


exports.errors.SocketException = 9001;
exports.errors.RecvStaleConfig = 9996;
exports.errors.NotMaster = 10107;
exports.errors.CannotGrowDocumentInCappedNamespace = 10003;
exports.errors.DuplicateKey = 11000;
exports.errors.InterruptedAtShutdown = 11600;
exports.errors.Interrupted = 11601;
exports.errors.InterruptedDueToReplStateChange = 11602;
exports.errors.OutOfDiskSpace = 14031;
exports.errors.KeyTooLong = 17280;
exports.errors.BackgroundOperationInProgressForDatabase = 12586;
exports.errors.BackgroundOperationInProgressForNamespace = 12587;
exports.errors.NotMasterOrSecondary = 13436;
exports.errors.NotMasterNoSlaveOk = 13435;
exports.errors.ShardKeyTooBig = 13334;
exports.errors.SendStaleConfig = 13388;
exports.errors.DatabaseDifferCase = 13297;
exports.errors.OBSOLETE_PrepareConfigsFailed = 13104;


exports.errors.NetworkError = [
  exports.errors.HostUnreachable,
  exports.errors.HostNotFound,
  exports.errors.NetworkTimeout
];
exports.errors.Interruption = [
  exports.errors.Interrupted,
  exports.errors.InterruptedAtShutdown,
  exports.errors.InterruptedDueToReplStateChange,
  exports.errors.ExceededTimeLimit
];
exports.errors.NotMasterError = [exports.errors.NotMaster, exports.errors.NotMasterNoSlaveOk];
exports.errors.StaleShardingError = [
  exports.errors.RecvStaleConfig,
  exports.errors.SendStaleConfig,
  exports.errors.StaleShardVersion,
  exports.errors.StaleEpoch
];
exports.errors.WriteConcernError = [
  exports.errors.WriteConcernFailed,
  exports.errors.WriteConcernLegacyOK,
  exports.errors.UnknownReplWriteConcern,
  exports.errors.CannotSatisfyWriteConcern
];