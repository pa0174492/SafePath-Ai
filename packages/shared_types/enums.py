from enum import Enum

class InferenceStatus(str, Enum):
    KNOWN = "KNOWN"
    INFERRED = "INFERRED"
    UNKNOWN = "UNKNOWN"

class ConfidenceLevel(str, Enum):
    VERY_HIGH = "VERY_HIGH"  # > 0.90
    HIGH = "HIGH"            # 0.75 - 0.90
    MEDIUM = "MEDIUM"        # 0.50 - 0.75
    LOW = "LOW"              # 0.30 - 0.50
    VERY_LOW = "VERY_LOW"    # < 0.30

class SurfaceType(str, Enum):
    ASPHALT = "asphalt"
    CONCRETE = "concrete"
    PAVING_STONES = "paving_stones"
    COBBLESTONE = "cobblestone"
    GRAVEL = "gravel"
    UNPAVED = "unpaved"
    UNKNOWN = "unknown"

class CrossingType(str, Enum):
    SIGNALIZED = "signalized"
    ZEBRA = "zebra"
    UNMARKED = "unmarked"
    ISLAND = "island"
    PELICAN = "pelican"
    UNKNOWN = "unknown"

class MobilityProfile(str, Enum):
    STANDARD = "STANDARD"
    WHEELCHAIR_MANUAL = "WHEELCHAIR_MANUAL"
    WHEELCHAIR_POWER = "WHEELCHAIR_POWER"
    STROLLER = "STROLLER"
    LOW_MOBILITY = "LOW_MOBILITY"
    ELDER_FRIENDLY = "ELDER_FRIENDLY"
    VISUAL_ASSIST = "VISUAL_ASSIST"
    TWO_WHEELER = "TWO_WHEELER"
    FOUR_WHEELER = "FOUR_WHEELER"
    AUTO_RICKSHAW = "AUTO_RICKSHAW"

class TransitMode(str, Enum):
    WALK = "WALK"
    TWO_WHEELER = "TWO_WHEELER"
    FOUR_WHEELER = "FOUR_WHEELER"
    AUTO_RICKSHAW = "AUTO_RICKSHAW"

class SystemExecutionMode(str, Enum):
    DEMO = "DEMO"
    RESEARCH = "RESEARCH"
    LIVE = "LIVE"

class HazardSeverity(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class IncidentCategory(str, Enum):
    CRIME = "CRIME"
    TRAFFIC_ACCIDENT = "TRAFFIC_ACCIDENT"
    ROAD_CLOSURE = "ROAD_CLOSURE"
    CONSTRUCTION = "CONSTRUCTION"
    WEATHER_HAZARD = "WEATHER_HAZARD"
    POOR_LIGHTING = "POOR_LIGHTING"
    ACCESSIBILITY_BLOCKAGE = "ACCESSIBILITY_BLOCKAGE"
